#!/usr/bin/env bun
/**
 * repair-segments.ts — rebuild the segments listed in defective.json.
 *
 * Rebuilds ONLY the segments present in the JSON. For each segment:
 *
 *   1. the defective media files (output_*.m3u8, segment_*.ts, audio.mp3) are
 *      MOVED to <root>/defective/<id>/ so nothing is deleted
 *   2. the renditions are rebuilt IN PLACE in <root>/<id>/ from the original
 *      master, using the same cut as scripts/export_cli.rs (marker-derived
 *      boundaries), except that the audio track is re-encoded instead of
 *      stream-copied so its PES timestamps land on the AAC frame grid
 *   3. the rebuilt playlist is decoded with ffmpeg; if it still reports a
 *      timestamp violation the originals are MOVED BACK from defective/ and
 *      the segment is reported as not repaired
 *
 * Images (card/desktop/mobile) are left untouched — they are not defective.
 * Nothing is ever deleted; --dry-run touches nothing at all.
 *
 * Usage:
 *   bun scripts/repair-segments.ts --dry-run        # show the plan only
 *   bun scripts/repair-segments.ts                  # repair everything listed
 *   bun scripts/repair-segments.ts --json ./defective.json
 *   bun scripts/repair-segments.ts --res 1080
 *   bun scripts/repair-segments.ts --ids 3q6QD1,3vMPKO
 *
 * Flags:
 *   --json <path>          defect list (default: ./defective.json)
 *   --root <dir>           compiled media root (default: /media/work/fragments/target)
 *   --masters <dir>        master video dir (default: /mnt/big_archive/performances)
 *   --processed <dir>      metadata JSON dir (default: /media/work/fragments/processed)
 *   --defective-dir <dir>  where originals are moved (default: <root>/defective)
 *   --res <list>           renditions to rebuild, comma separated (default: 1080,480)
 *   --mode <mode>          thorough (default) | copy
 *                          thorough re-encodes video+audio with the full
 *                          timestamp/keyframe safety set; copy keeps the
 *                          lossless video stream copy (cannot fix inherited
 *                          timestamps)
 *   --encoder <name>       nvenc (default, needs an Nvidia GPU) | libx264
 *   --db <path>            D1 sqlite (default: the single *.sqlite in
 *                          .wrangler/state/v3/d1/miniflare-D1DatabaseObject)
 *   --ids <a,b,c>          only these ids from the JSON
 *   --limit <n>            stop after n segments
 *   --keep-failed          keep rebuilt files even when verification fails
 *   --stop-on-error        abort on the first segment that cannot be repaired
 *   --dry-run              print every command, change nothing
 *   --verify-only          only verify the current files, change nothing
 *   --restore              put the newest archived originals back (undo)
 *   --strict               also fail on playlist-boundary DTS duplicates
 *                          (off by default: HLS splitting a copied stream can
 *                          repeat one audio packet across a chunk boundary,
 *                          which players tolerate)
 *   --help                 show this text
 *
 * Exit code: 0 when every segment was repaired, 1 when any segment failed
 * (or on a fatal error), 2 for --dry-run.
 */

import fs from "node:fs";
import path from "node:path";
import { Database } from "bun:sqlite";

const DEFAULT_ROOT = "/media/work/fragments/target";
const DEFAULT_MASTERS = "/mnt/big_archive/performances";
const DEFAULT_PROCESSED = "/media/work/fragments/processed";
const DEFAULT_JSON = "defective.json";
const D1_DIR = ".wrangler/state/v3/d1/miniflare-D1DatabaseObject";

const MASTER_EXTENSIONS = ["mp4", "mkv", "mov", "webm"];
const MEDIA_EXTENSIONS = [".m3u8", ".ts", ".mp3"];
const TIMESTAMP_ERROR =
  /non monotonically increasing dts to muxer in stream (\d+): (-?\d+) >= (-?\d+)/;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
interface DefectEntry {
  performance: string;
  title: string;
  id: string;
  startTime?: number;
  duration?: number;
  reasons?: string[];
}

interface Options {
  json: string;
  root: string;
  masters: string;
  processed: string;
  defectiveDir: string | null;
  res: ("480" | "1080")[];
  mode: "thorough" | "copy";
  encoder: "libx264" | "nvenc";
  db?: string;
  ids: string[];
  limit: number;
  keepFailed: boolean;
  stopOnError: boolean;
  dryRun: boolean;
  verifyOnly: boolean;
  restore: boolean;
  strict: boolean;
  runId: string;
}

type Outcome =
  | "repaired"
  | "verified"
  | "failed"
  | "skipped"
  | "planned"
  | "restored";

// ---------------------------------------------------------------------------
// Interrupt handling: ^C must never leave a segment without its files
// ---------------------------------------------------------------------------
let interrupted = false;
let activeChild: ReturnType<typeof Bun.spawn> | null = null;

function installSignalHandler(): void {
  const onSignal = (signal: string): void => {
    if (interrupted) process.exit(130);
    interrupted = true;
    console.error(`\n${signal} — killing ffmpeg, then restoring the current segment…`);
    try {
      activeChild?.kill("SIGKILL");
    } catch {
      // already gone
    }
  };
  process.on("SIGINT", () => onSignal("SIGINT"));
  process.on("SIGTERM", () => onSignal("SIGTERM"));
}

interface Result {
  id: string;
  performance: string;
  title: string;
  outcome: Outcome;
  detail: string;
  warnings?: string[];
}

// ---------------------------------------------------------------------------
// Args
// ---------------------------------------------------------------------------
function fail(message: string): never {
  console.error(`error: ${message}`);
  process.exit(1);
}

function parseArgs(argv: string[]): Options {
  const opts: Options = {
    json: DEFAULT_JSON,
    root: DEFAULT_ROOT,
    masters: DEFAULT_MASTERS,
    processed: DEFAULT_PROCESSED,
    defectiveDir: null,
    res: ["1080", "480"],
    mode: "thorough",
    encoder: "nvenc",
    ids: [],
    limit: Number.POSITIVE_INFINITY,
    keepFailed: false,
    stopOnError: false,
    dryRun: false,
    verifyOnly: false,
    restore: false,
    strict: false,
    runId: "",
  };

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    const next = (): string => {
      const value = argv[++i];
      if (value === undefined) fail(`missing value for ${arg}`);
      return value;
    };

    switch (arg) {
      case "--json":
        opts.json = path.resolve(next());
        break;
      case "--root":
        opts.root = path.resolve(next());
        break;
      case "--masters":
        opts.masters = path.resolve(next());
        break;
      case "--processed":
        opts.processed = path.resolve(next());
        break;
      case "--defective-dir":
        opts.defectiveDir = path.resolve(next());
        break;
      case "--res": {
        const list = next()
          .split(",")
          .map((value) => value.trim())
          .filter(Boolean);
        for (const value of list) {
          if (value !== "480" && value !== "1080")
            fail(`--res must be a subset of 480,1080 (got "${value}")`);
        }
        opts.res = list as ("480" | "1080")[];
        break;
      }
      case "--mode": {
        const mode = next();
        if (mode !== "thorough" && mode !== "copy")
          fail("--mode must be thorough or copy");
        opts.mode = mode;
        break;
      }
      case "--encoder": {
        const encoder = next();
        if (encoder !== "libx264" && encoder !== "nvenc")
          fail("--encoder must be libx264 or nvenc");
        opts.encoder = encoder;
        break;
      }
      case "--db":
        opts.db = next();
        break;
      case "--ids":
        opts.ids = next()
          .split(",")
          .map((id) => id.trim())
          .filter(Boolean);
        break;
      case "--limit": {
        const n = Number.parseInt(next(), 10);
        if (!Number.isFinite(n) || n < 1) fail("--limit must be a number >= 1");
        opts.limit = n;
        break;
      }
      case "--keep-failed":
        opts.keepFailed = true;
        break;
      case "--stop-on-error":
        opts.stopOnError = true;
        break;
      case "--dry-run":
        opts.dryRun = true;
        break;
      case "--verify-only":
        opts.verifyOnly = true;
        break;
      case "--restore":
        opts.restore = true;
        break;
      case "--strict":
        opts.strict = true;
        break;
      case "--help":
      case "-h":
        printHelp();
        process.exit(0);
      default:
        fail(`unknown flag ${arg} (try --help)`);
    }
  }

  opts.json = path.resolve(opts.json);
  if (!opts.defectiveDir) opts.defectiveDir = path.join(opts.root, "defective");
  return opts;
}

function printHelp(): void {
  const text = fs.readFileSync(import.meta.path, "utf-8");
  const start = text.indexOf("/**") + 3;
  const end = text.indexOf("*/");
  console.log(
    text
      .slice(start, end)
      .replace(/^\s*\* ?/gm, "")
      .trim(),
  );
}

// ---------------------------------------------------------------------------
// Database
// ---------------------------------------------------------------------------
interface SegmentRow {
  id: string;
  title: string;
  performance: string;
  startTime: number;
  duration: number;
  masterDuration: number;
}

function resolveDb(explicit?: string): string {
  if (explicit) {
    if (!fs.existsSync(explicit)) fail(`database not found: ${explicit}`);
    return path.resolve(explicit);
  }
  if (!fs.existsSync(D1_DIR)) {
    fail(`no ${D1_DIR} directory — pass --db <path>`);
  }
  const candidates = fs
    .readdirSync(D1_DIR)
    .filter((name) => name.endsWith(".sqlite") && name !== "metadata.sqlite")
    .map((name) => path.join(D1_DIR, name));
  if (candidates.length === 0) fail(`no .sqlite files in ${D1_DIR} — pass --db`);
  if (candidates.length > 1) {
    fail(
      `multiple databases in ${D1_DIR}; pass --db explicitly:\n` +
        candidates.map((c) => `  ${c}`).join("\n"),
    );
  }
  return candidates[0];
}

function loadSegments(dbPath: string): Map<string, SegmentRow> {
  const db = new Database(dbPath, { readonly: true });
  try {
    const rows = db
      .query(
        "SELECT id, title, performance, startTime, duration, CAST(masterDuration AS INTEGER) AS masterDuration FROM segments",
      )
      .all() as SegmentRow[];
    return new Map(rows.map((row) => [row.id, row]));
  } finally {
    db.close();
  }
}

// ---------------------------------------------------------------------------
// Boundaries (must reproduce export_cli.rs exactly)
// ---------------------------------------------------------------------------
/**
 * export_cli builds the timeline as [0, ...markers, totalDuration] and cuts
 * segment i with `-ss round(timeline[i]) -to round(timeline[i+1])`, so those
 * are the boundaries we must reuse. Falls back to startTime/duration from the
 * database when the processed JSON is unavailable.
 */
function segmentBounds(
  performance: string,
  index: number,
  row: SegmentRow | undefined,
  processedDir: string,
): { start: number; end: number; source: string } {
  const metaPath = path.join(processedDir, `${performance}.json`);
  if (fs.existsSync(metaPath)) {
    try {
      const meta = JSON.parse(fs.readFileSync(metaPath, "utf-8")) as {
        markers?: number[];
      };
      const markers = Array.isArray(meta.markers) ? meta.markers : [];
      const total = row?.masterDuration && row.masterDuration > 0 ? row.masterDuration : 0;
      const timeline = [0, ...markers, ...(total > 0 ? [total] : [])];
      if (index >= 0 && index + 1 < timeline.length) {
        return {
          start: Math.round(timeline[index]),
          end: Math.round(timeline[index + 1]),
          source: "markers",
        };
      }
    } catch {
      // fall through to the database values
    }
  }

  if (!row) throw new Error("no markers and no database row");
  const start = Math.round(row.startTime);
  return { start, end: start + Math.round(row.duration), source: "db" };
}

function parseIndex(title: string): number | null {
  const match = /^segment_(\d+)$/.exec(title);
  return match ? Number.parseInt(match[1], 10) : null;
}

// ---------------------------------------------------------------------------
// Filesystem helpers (move only — never delete)
// ---------------------------------------------------------------------------
function findMaster(mastersDir: string, performance: string): string | null {
  for (const ext of MASTER_EXTENSIONS) {
    const candidate = path.join(mastersDir, `${performance}.${ext}`);
    if (fs.existsSync(candidate)) return candidate;
  }
  return null;
}

function mediaFilesIn(dir: string): string[] {
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((name) => MEDIA_EXTENSIONS.some((ext) => name.endsWith(ext)))
    .sort();
}

function moveFiles(from: string, to: string, files: string[]): void {
  fs.mkdirSync(to, { recursive: true });
  for (const file of files) {
    const src = path.join(from, file);
    const dest = path.join(to, file);
    if (fs.existsSync(dest)) {
      // never overwrite an archived copy: suffix it instead
      const suffix = Date.now().toString(36);
      fs.renameSync(src, `${dest}.${suffix}`);
    } else {
      fs.renameSync(src, dest);
    }
  }
}

/** Puts the archived originals back, parking any partial rebuild. */
function restoreOriginals(segmentDir: string, archiveDir: string): void {
  const rebuilt = mediaFilesIn(segmentDir);
  if (rebuilt.length > 0) {
    moveFiles(segmentDir, path.join(archiveDir, "rebuilt-unverified"), rebuilt);
  }
  if (fs.existsSync(archiveDir)) {
    moveFiles(archiveDir, segmentDir, mediaFilesIn(archiveDir));
  }
}

/** Newest archive folder for a segment (handles runs without a run-id dir). */
function newestArchiveDir(defectiveDir: string, id: string): string | null {
  const base = path.join(defectiveDir, id);
  if (!fs.existsSync(base)) return null;
  if (mediaFilesIn(base).length > 0) return base;

  const runs = fs
    .readdirSync(base)
    .filter((name) => {
      const full = path.join(base, name);
      return fs.statSync(full).isDirectory() && mediaFilesIn(full).length > 0;
    })
    .sort();
  return runs.length > 0 ? path.join(base, runs[runs.length - 1]) : null;
}

// ---------------------------------------------------------------------------
// ffmpeg
// ---------------------------------------------------------------------------
/** Video encoder options for the thorough (re-encode) rebuild. */
function videoEncodeArgs(encoder: "libx264" | "nvenc"): string[] {
  if (encoder === "nvenc") {
    // constant-quality VBR, two-pass fullres, AQ on — best quality per second
    // on Turing/Ampere; the 3060 handles this far faster than libx264
    return [
      "-c:v",
      "h264_nvenc",
      "-preset",
      "p6",
      "-tune",
      "hq",
      "-rc",
      "vbr",
      "-cq",
      "19",
      "-b:v",
      "0",
      "-maxrate",
      "20M",
      "-bufsize",
      "40M",
      "-profile:v",
      "high",
      "-spatial-aq",
      "1",
      "-aq-strength",
      "8",
      "-temporal-aq",
      "1",
      "-rc-lookahead",
      "32",
      "-multipass",
      "fullres",
      // no adaptive I-frames at scene cuts, so the forced 6s keyframes are
      // the only splits; forced-idr keeps each chunk decodable on its own
      "-no-scenecut",
      "1",
      "-forced-idr",
      "1",
    ];
  }
  return [
    "-c:v",
    "libx264",
    "-preset",
    "medium",
    "-crf",
    "18",
    "-profile:v",
    "high",
    // no extra scene-cut keyframes: chunk splits stay exactly on the forced 6s
    "-sc_threshold",
    "0",
  ];
}

/**
 * Builds the HLS cut command.
 *
 * thorough (default) re-encodes both streams so ffmpeg owns every timestamp:
 * no inherited PTS/DTS can survive, keyframes are forced every 6s so the HLS
 * split points are exact, CFR removes variable-rate jitter, and the timeline
 * is rebased to zero with no mux delay. Audio is rebuilt with async resampling
 * so the AAC frames sit on an exact 1024-sample grid.
 *
 * copy keeps the old lossless attempt (video stream copy) for comparison; it
 * cannot fix inherited timestamps, which is why it failed before.
 */
function buildCommand(
  input: string,
  start: number,
  end: number,
  segmentDir: string,
  res: "480" | "1080",
  opts: Options,
): string[] {
  const timeline = [
    "-fflags",
    "+genpts",
    "-avoid_negative_ts",
    "make_zero",
    "-muxdelay",
    "0",
    "-muxpreload",
    "0",
    "-max_muxing_queue_size",
    "4096",
  ];

  const encoding =
    opts.mode === "thorough"
      ? [
          ...videoEncodeArgs(opts.encoder),
          "-pix_fmt",
          "yuv420p",
          "-fps_mode",
          "cfr",
          "-force_key_frames",
          "expr:gte(t,n_forced*6)",
          "-c:a",
          "aac",
          "-b:a",
          "192k",
          "-ar",
          "48000",
          "-ac",
          "2",
          "-af",
          "aresample=async=1",
        ]
      : [
          "-c:v",
          "copy",
          "-c:a",
          "aac",
          "-b:a",
          "192k",
          "-ar",
          "48000",
          "-ac",
          "2",
          "-af",
          "aresample=async=1",
        ];

  return [
    "ffmpeg",
    "-y",
    "-hide_banner",
    "-loglevel",
    "warning",
    "-nostdin",
    // -noaccurate_seek keeps the frames between the seek point and the
    // preceding keyframe, so the rebuilt segment starts on the same keyframe
    // as the original build and the neighbours stay contiguous.
    "-ss",
    String(start),
    "-to",
    String(end),
    "-noaccurate_seek",
    "-i",
    input,
    // only the first video and first audio track, no subtitles/data/metadata
    "-map",
    "0:v:0",
    "-map",
    "0:a:0",
    "-map_metadata",
    "-1",
    ...encoding,
    ...timeline,
    "-mpegts_flags",
    "+resend_headers",
    "-hls_time",
    "6",
    "-hls_list_size",
    "0",
    "-hls_playlist_type",
    "vod",
    "-hls_flags",
    "independent_segments",
    "-hls_segment_filename",
    path.join(segmentDir, `segment_${res}_%03d.ts`),
    path.join(segmentDir, `output_${res}.m3u8`),
  ];
}

function audioCommand(
  input: string,
  start: number,
  end: number,
  out: string,
): string[] {
  return [
    "ffmpeg",
    "-y",
    "-hide_banner",
    "-loglevel",
    "warning",
    "-nostdin",
    "-ss",
    String(start),
    "-to",
    String(end),
    "-noaccurate_seek",
    "-i",
    input,
    "-map",
    "0:a:0",
    "-map_metadata",
    "-1",
    "-c:a",
    "copy",
    "-avoid_negative_ts",
    "make_zero",
    out,
  ];
}

function shellQuote(args: string[]): string {
  return args
    .map((arg) => (/^[A-Za-z0-9_./:=+-]+$/.test(arg) ? arg : `'${arg.replace(/'/g, `'\\''`)}'`))
    .join(" ");
}

async function run(args: string[]): Promise<{ ok: boolean; code: number; stderr: string }> {
  const proc = Bun.spawn(args, { stdout: "ignore", stderr: "pipe" });
  activeChild = proc;
  try {
    const [stderr, code] = await Promise.all([
      new Response(proc.stderr).text(),
      proc.exited,
    ]);
    return { ok: code === 0, code, stderr };
  } finally {
    activeChild = null;
  }
}

function playlistChunks(text: string): string[] {
  const chunks: string[] = [];
  for (const line of text.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    if (/^\S+\.ts$/.test(trimmed)) chunks.push(trimmed);
  }
  return chunks;
}

/**
 * Decodes one media file with ffmpeg and returns every timestamp violation it
 * reports, normalised to "stream N: A vs B (backwards|duplicate)".
 */
async function decodeViolations(
  file: string,
): Promise<{ violations: string[]; failure: string | null }> {
  const { ok, code, stderr } = await run([
    "ffmpeg",
    "-hide_banner",
    "-v",
    "error",
    "-i",
    file,
    "-f",
    "null",
    "-",
  ]);

  const violations: string[] = [];
  for (const line of stderr.split("\n")) {
    const match = TIMESTAMP_ERROR.exec(line);
    if (!match) continue;
    const stream = match[1];
    const first = Number(match[2]);
    const second = Number(match[3]);
    const kind =
      first < second
        ? `backwards by ${second - first} ticks`
        : first === second
          ? "duplicate timestamp"
          : `out of order (${first} vs ${second})`;
    violations.push(`stream ${stream}: ${(first / 90000).toFixed(6)}s ${kind}`);
  }

  if (!ok && violations.length === 0) {
    const detail = stderr.trim().split("\n").slice(-1)[0];
    return { violations, failure: `decode failed${detail ? `: ${detail}` : ` (exit ${code})`}` };
  }
  return { violations, failure: null };
}

interface VerifyReport {
  problems: string[];
  warnings: string[];
}

/**
 * Verifies a rebuilt rendition the way the player consumes it: one chunk at a
 * time. A violation inside a chunk is a real defect and fails the segment.
 *
 * Decoding the whole playlist additionally surfaces duplicate timestamps where
 * one audio packet straddles a segment boundary — an artefact of HLS splitting
 * a copied stream, not a per-chunk defect — so those are reported as warnings
 * unless --strict is given.
 */
async function verifyRendition(
  segmentDir: string,
  res: "480" | "1080",
  opts: Options,
): Promise<VerifyReport> {
  const playlistPath = path.join(segmentDir, `output_${res}.m3u8`);
  if (!fs.existsSync(playlistPath)) {
    return { problems: [`${res}p playlist missing`], warnings: [] };
  }

  const problems: string[] = [];
  const warnings: string[] = [];
  const chunks = playlistChunks(fs.readFileSync(playlistPath, "utf-8"));
  if (chunks.length === 0) problems.push(`${res}p playlist lists no chunks`);

  for (const chunk of chunks) {
    const file = path.join(segmentDir, chunk);
    if (!fs.existsSync(file)) {
      problems.push(`${res}p ${chunk}: missing`);
      continue;
    }
    const { violations, failure } = await decodeViolations(file);
    if (failure) problems.push(`${res}p ${chunk}: ${failure}`);
    for (const violation of violations) problems.push(`${res}p ${chunk}: ${violation}`);
  }

  if (problems.length === 0) {
    const { violations, failure } = await decodeViolations(playlistPath);
    if (failure) warnings.push(`${res}p playlist: ${failure}`);
    for (const violation of violations) {
      const message = `${res}p playlist boundary: ${violation}`;
      if (opts.strict) problems.push(message);
      else warnings.push(message);
    }
  }

  return { problems, warnings };
}

// ---------------------------------------------------------------------------
// Repair one segment
// ---------------------------------------------------------------------------
async function repairSegment(
  entry: DefectEntry,
  row: SegmentRow | undefined,
  opts: Options,
): Promise<Result> {
  const base = { id: entry.id, performance: entry.performance, title: entry.title };

  const segmentDir = path.join(opts.root, entry.id);

  // --restore puts the newest archived originals back (used after ^C)
  if (opts.restore) {
    const archiveDir = newestArchiveDir(opts.defectiveDir!, entry.id);
    if (!archiveDir) {
      return { ...base, outcome: "skipped", detail: "no archived originals found" };
    }
    fs.mkdirSync(segmentDir, { recursive: true });
    restoreOriginals(segmentDir, archiveDir);
    return { ...base, outcome: "restored", detail: `originals restored from ${archiveDir}` };
  }

  if (!fs.existsSync(segmentDir)) {
    return { ...base, outcome: "skipped", detail: `segment dir missing: ${segmentDir}` };
  }

  // --verify-only inspects the current files and changes nothing
  if (opts.verifyOnly) {
    const problems: string[] = [];
    const warnings: string[] = [];
    for (const res of opts.res) {
      const report = await verifyRendition(segmentDir, res, opts);
      problems.push(...report.problems);
      warnings.push(...report.warnings);
    }
    if (problems.length === 0) {
      return {
        ...base,
        outcome: "verified",
        detail: `clean${warnings.length ? ` (${warnings.length} boundary warning(s))` : ""}`,
        warnings,
      };
    }
    return { ...base, outcome: "failed", detail: problems.join(" | ") };
  }

  const index = parseIndex(entry.title);
  if (index === null) {
    return { ...base, outcome: "skipped", detail: `cannot parse index from title "${entry.title}"` };
  }

  const master = findMaster(opts.masters, entry.performance);
  if (!master) {
    return {
      ...base,
      outcome: "skipped",
      detail: `master not found: ${path.join(opts.masters, `${entry.performance}.{${MASTER_EXTENSIONS.join(",")}}`)}`,
    };
  }

  let bounds: { start: number; end: number; source: string };
  try {
    bounds = segmentBounds(entry.performance, index, row, opts.processed);
  } catch (error) {
    return { ...base, outcome: "skipped", detail: (error as Error).message };
  }

  const masterDir = path.join(opts.root, "masters", entry.performance);
  const lowResMaster = path.join(masterDir, "master_300p.mp4");
  const masterAudio = path.join(masterDir, "master_audio.mp3");
  const archiveDir = path.join(opts.defectiveDir!, entry.id, opts.runId);

  const current = mediaFilesIn(segmentDir);
  const commands: { label: string; args: string[] }[] = [];

  for (const res of opts.res) {
    if (res === "480" && !fs.existsSync(lowResMaster)) continue;
    commands.push({
      label: `rebuild ${res}p`,
      args: buildCommand(
        res === "480" ? lowResMaster : master,
        bounds.start,
        bounds.end,
        segmentDir,
        res,
        opts,
      ),
    });
  }
  if (fs.existsSync(masterAudio)) {
    commands.push({
      label: "re-slice audio.mp3",
      args: audioCommand(masterAudio, bounds.start, bounds.end, path.join(segmentDir, "audio.mp3")),
    });
  }

  const notes: string[] = [];
  if (opts.res.includes("480") && !fs.existsSync(lowResMaster)) {
    notes.push(`480p not rebuilt (missing ${lowResMaster})`);
  }

  if (opts.dryRun) {
    for (const command of commands) {
      console.log(`  ${command.label}: ${shellQuote(command.args)}`);
    }
    return {
      ...base,
      outcome: "planned",
      detail: `cut ${bounds.start}-${bounds.end}s (${bounds.source}); move ${current.length} file(s) to ${archiveDir}`,
    };
  }

  if (interrupted) {
    return { ...base, outcome: "skipped", detail: "interrupted before any change" };
  }

  // 1. archive the defective media, then rebuild into the now-empty segment dir
  moveFiles(segmentDir, archiveDir, current);

  const failures: string[] = [];
  for (const command of commands) {
    if (interrupted) break;
    const { ok, code, stderr } = await run(command.args);
    if (!ok) {
      const last = stderr.trim().split("\n").slice(-1)[0];
      failures.push(`${command.label}: ${last || `ffmpeg exited ${code}`}`);
    }
  }

  if (interrupted) {
    restoreOriginals(segmentDir, archiveDir);
    return { ...base, outcome: "skipped", detail: "interrupted — originals restored" };
  }

  // 2. verify every rebuilt rendition (per chunk, plus a boundary-only pass)
  const problems: string[] = [...failures];
  const warnings: string[] = [];
  for (const res of opts.res) {
    if (res === "480" && !fs.existsSync(lowResMaster)) continue;
    const report = await verifyRendition(segmentDir, res, opts);
    problems.push(...report.problems);
    warnings.push(...report.warnings);
  }

  if (problems.length === 0) {
    return {
      ...base,
      outcome: "repaired",
      detail:
        `cut ${bounds.start}-${bounds.end}s (${bounds.source}); originals archived to ${archiveDir}` +
        (notes.length ? `; ${notes.join("; ")}` : "") +
        (warnings.length ? `; ${warnings.length} boundary warning(s), see below` : ""),
      warnings,
    };
  }

  // 3. put the originals back unless the caller wants to keep the attempt
  if (!opts.keepFailed) restoreOriginals(segmentDir, archiveDir);

  return {
    ...base,
    outcome: "failed",
    detail:
      problems.join(" | ") +
      (opts.keepFailed ? " (rebuilt files kept)" : " (originals restored)"),
  };
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
async function main(): Promise<void> {
  const opts = parseArgs(process.argv.slice(2));
  installSignalHandler();

  // one archive folder per run, so re-running never collides with old copies
  opts.runId = new Date().toISOString().replace(/[:.]/g, "-");

  if (!fs.existsSync(opts.json)) fail(`defect list not found: ${opts.json}`);
  if (!fs.existsSync(opts.root)) fail(`media root not found: ${opts.root}`);
  if (!opts.verifyOnly && !opts.restore && !fs.existsSync(opts.masters)) {
    fail(
      `masters dir not found: ${opts.masters}\n` +
        `is the archive drive mounted? (nothing was changed)`,
    );
  }
  if (!Bun.which("ffmpeg")) fail("ffmpeg not found in PATH");

  // Preflight the encoder before touching anything: a missing driver or an
  // unsupported flag must fail here, not halfway through the batch.
  if (!opts.verifyOnly && !opts.dryRun && opts.mode === "thorough") {
    const encoder = opts.encoder === "nvenc" ? "h264_nvenc" : "libx264";
    const probe = await run([
      "ffmpeg",
      "-hide_banner",
      "-v",
      "error",
      "-f",
      "lavfi",
      "-i",
      "nullsrc=s=256x144:d=0.2",
      "-frames:v",
      "2",
      "-pix_fmt",
      "yuv420p",
      ...videoEncodeArgs(opts.encoder),
      "-f",
      "null",
      "-",
    ]);
    if (!probe.ok) {
      fail(
        `encoder ${encoder} cannot run:\n${probe.stderr.trim() || `ffmpeg exited ${probe.code}`}\n` +
          `nothing was changed — retry with --encoder libx264`,
      );
    }
    console.log(`encoder:     ${encoder} (preflight ok)`);
  }

  const raw = JSON.parse(fs.readFileSync(opts.json, "utf-8")) as DefectEntry[];
  if (!Array.isArray(raw)) fail(`${opts.json} must contain a JSON array`);

  let entries = raw.filter((entry) => entry && entry.id && entry.performance);
  if (opts.ids.length > 0) {
    const wanted = new Set(opts.ids);
    entries = entries.filter((entry) => wanted.has(entry.id));
  }
  entries = entries.slice(0, opts.limit);

  if (entries.length === 0) fail(`no usable entries in ${opts.json}`);

  const rows = loadSegments(resolveDb(opts.db));

  console.log(`defect list: ${opts.json}`);
  console.log(`masters:     ${opts.masters}`);
  console.log(`root:        ${opts.root}${opts.dryRun ? "   [dry run — nothing will change]" : ""}${opts.verifyOnly ? "   [verify only — nothing will change]" : ""}`);
  console.log(`archive:     ${opts.defectiveDir}`);
  console.log(
    `renditions:  ${opts.res.join(", ")}   mode: ${opts.mode}   encoder: ${opts.encoder}`,
  );
  console.log(`mode:        ${opts.verifyOnly ? "verify only" : "rebuild"}${opts.strict ? " (strict)" : ""}`);
  console.log(`segments:    ${entries.length}\n`);

  const results: Result[] = [];

  for (let i = 0; i < entries.length; i++) {
    if (interrupted) break;
    const entry = entries[i];
    console.log(`[${i + 1}/${entries.length}] ${entry.id}  ${entry.performance} / ${entry.title}`);
    const result = await repairSegment(entry, rows.get(entry.id), opts);
    results.push(result);

    const icon =
      result.outcome === "repaired" ||
      result.outcome === "verified" ||
      result.outcome === "restored"
        ? "✓"
        : result.outcome === "planned"
          ? "·"
          : result.outcome === "skipped"
            ? "–"
            : "✗";
    console.log(`  ${icon} ${result.outcome}: ${result.detail}\n`);
    for (const warning of result.warnings ?? []) {
      console.log(`    ! ${warning}`);
    }
    if (result.warnings?.length) console.log("");

    if (result.outcome === "failed" && opts.stopOnError) break;
  }

  if (interrupted) {
    console.log("\ninterrupted — the segment in flight was restored from the archive.");
    const remaining = entries.slice(results.length);
    if (remaining.length > 0) {
      console.log(`not processed (${remaining.length}): ${remaining.map((e) => e.id).join(", ")}`);
    }
  }

  const count = (outcome: Outcome): number =>
    results.filter((result) => result.outcome === outcome).length;
  const repaired = count("repaired");
  const verified = count("verified");
  const restored = count("restored");
  const planned = count("planned");
  const failed = count("failed");
  const skipped = count("skipped");

  console.log("summary");
  if (opts.dryRun) console.log(`  planned:  ${planned}`);
  else if (opts.verifyOnly) console.log(`  verified: ${verified}`);
  else if (opts.restore) console.log(`  restored: ${restored}`);
  else console.log(`  repaired: ${repaired}`);
  console.log(`  failed:   ${failed}`);
  console.log(`  skipped:  ${skipped}`);

  const problematic = results.filter(
    (result) => result.outcome === "failed" || result.outcome === "skipped",
  );
  if (problematic.length > 0) {
    console.log("\nstill needs attention:");
    for (const result of problematic) {
      console.log(`  ${result.id}  ${result.performance} / ${result.title}`);
      console.log(`    ${result.detail}`);
    }
  }

  if (opts.dryRun) process.exit(2);
  process.exit(failed > 0 ? 1 : 0);
}

await main();
