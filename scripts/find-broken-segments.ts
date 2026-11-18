#!/usr/bin/env bun
/**
 * find-broken-segments.ts — find compiled segments that strict players reject.
 *
 * Reads `segments` from the local D1 database, then for every segment loads
 * `<root>/<id>/output_<res>.m3u8` and scans the referenced transport streams
 * for defects that AVFoundation/Safari refuses but ffmpeg tolerates:
 *
 *   - non-monotonic timestamps on any elementary stream
 *   - audio PES timestamps that are not on the AAC frame grid (the 3q6QD1
 *     defect: one PES sits 30 ticks = 0.333ms early, which makes ffmpeg report
 *     a "non monotonically increasing dts" and can make strict demuxers drop
 *     the stream)
 *   - TS packets without the 0x47 sync byte (corrupt/truncated chunk)
 *   - chunk size not a multiple of 188 bytes (truncated chunk)
 *
 * No ffmpeg subprocess: the TS/PES headers are parsed directly, so a scan is
 * pure file I/O and takes milliseconds per segment.
 *
 * Usage:
 *   bun scripts/find-broken-segments.ts
 *   bun scripts/find-broken-segments.ts --res 1080
 *   bun scripts/find-broken-segments.ts --chunks all        # every chunk, slow
 *   bun scripts/find-broken-segments.ts --ids 3q6QD1,3snDSx # spot check
 *   bun scripts/find-broken-segments.ts --performance decibel_force-ding_dong_lounge-20241012
 *   bun scripts/find-broken-segments.ts --confirm          # vetted list
 *   bun scripts/find-broken-segments.ts --limit 200 --quiet
 *   bun scripts/find-broken-segments.ts --db ./.wrangler/state/.../foo.sqlite
 *
 * Flags:
 *   --db <path>         D1 sqlite file (default: the single *.sqlite in
 *                       .wrangler/state/v3/d1/miniflare-D1DatabaseObject)
 *   --root <dir>        media root (default: /media/work/fragments/target)
 *   --res <480|1080>    rendition to check (default: 480)
 *   --chunks <n|all>    how many chunks per segment to scan (default: 1)
 *   --ids <a,b,c>       only these segment ids
 *   --performance <a,b> only these performance slugs
 *   --limit <n>         stop after n segments
 *   --concurrency <n>   parallel file scans (default: 8)
 *   --out <path>        where to write the JSON list
 *                       (default: /tmp/opencode/defective-segments.json)
 *   --no-out            don't write a JSON file
 *   --confirm           re-decode each candidate with ffmpeg and keep only the
 *                       ones where the decode really reports a timestamp
 *                       violation (kills the off-grid false positives)
 *   --include-missing   also flag segments with no compiled output
 *   --quiet             only print the summary and the JSON file path
 *   --help              show this text
 *
 * Exit code is 0 when the scan completes, 1 on a fatal error (bad db, etc),
 * regardless of how many defects were found.
 */

import fs from "node:fs";
import path from "node:path";
import { Database } from "bun:sqlite";

const DEFAULT_ROOT = "/media/work/fragments/target";
const DEFAULT_OUT = "/home/andres/code/web/defective-segments.json";
const D1_DIR = ".wrangler/state/v3/d1/miniflare-D1DatabaseObject";

const TS_PACKET_SIZE = 188;
const TS_SYNC_BYTE = 0x47;
const DTS_CLOCK = 90_000;

// ---------------------------------------------------------------------------
// Args
// ---------------------------------------------------------------------------
interface Options {
  db?: string;
  root: string;
  res: "480" | "1080";
  chunks: number | "all";
  ids: string[];
  performances: string[];
  limit: number;
  concurrency: number;
  out: string | null;
  includeMissing: boolean;
  confirm: boolean;
  quiet: boolean;
}

function fail(message: string): never {
  console.error(`error: ${message}`);
  process.exit(1);
}

function parseArgs(argv: string[]): Options {
  const opts: Options = {
    root: DEFAULT_ROOT,
    res: "480",
    chunks: 1,
    ids: [],
    performances: [],
    limit: Number.POSITIVE_INFINITY,
    concurrency: 8,
    out: DEFAULT_OUT,
    includeMissing: false,
    confirm: false,
    quiet: false,
  };

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    const next = (): string => {
      const value = argv[++i];
      if (value === undefined) fail(`missing value for ${arg}`);
      return value;
    };

    switch (arg) {
      case "--db":
        opts.db = next();
        break;
      case "--root":
        opts.root = path.resolve(next());
        break;
      case "--res": {
        const value = next();
        if (value !== "480" && value !== "1080")
          fail("--res must be 480 or 1080");
        opts.res = value;
        break;
      }
      case "--chunks": {
        const value = next();
        if (value === "all") opts.chunks = "all";
        else {
          const n = Number.parseInt(value, 10);
          if (!Number.isFinite(n) || n < 1)
            fail("--chunks must be a number >= 1 or 'all'");
          opts.chunks = n;
        }
        break;
      }
      case "--ids":
        opts.ids = next()
          .split(",")
          .map((id) => id.trim())
          .filter(Boolean);
        break;
      case "--performance":
        opts.performances = next()
          .split(",")
          .map((slug) => slug.trim())
          .filter(Boolean);
        break;
      case "--limit": {
        const n = Number.parseInt(next(), 10);
        if (!Number.isFinite(n) || n < 1) fail("--limit must be a number >= 1");
        opts.limit = n;
        break;
      }
      case "--concurrency": {
        const n = Number.parseInt(next(), 10);
        if (!Number.isFinite(n) || n < 1)
          fail("--concurrency must be a number >= 1");
        opts.concurrency = n;
        break;
      }
      case "--out":
        opts.out = path.resolve(next());
        break;
      case "--no-out":
        opts.out = null;
        break;
      case "--include-missing":
        opts.includeMissing = true;
        break;
      case "--confirm":
        opts.confirm = true;
        break;
      case "--quiet":
        opts.quiet = true;
        break;
      case "--help":
      case "-h":
        printHelp();
        process.exit(0);
      default:
        fail(`unknown flag ${arg} (try --help)`);
    }
  }

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
}

function resolveDb(explicit?: string): string {
  if (explicit) {
    if (!fs.existsSync(explicit)) fail(`database not found: ${explicit}`);
    return path.resolve(explicit);
  }

  if (!fs.existsSync(D1_DIR)) {
    fail(
      `no ${D1_DIR} directory — pass --db <path> or run wrangler locally once`,
    );
  }

  const candidates = fs
    .readdirSync(D1_DIR)
    .filter((name) => name.endsWith(".sqlite") && name !== "metadata.sqlite")
    .map((name) => path.join(D1_DIR, name));

  if (candidates.length === 0)
    fail(`no .sqlite files in ${D1_DIR} — pass --db <path>`);
  if (candidates.length > 1) {
    fail(
      `multiple databases in ${D1_DIR}; pass --db explicitly:\n` +
        candidates.map((c) => `  ${c}`).join("\n"),
    );
  }
  return candidates[0];
}

function loadSegments(dbPath: string): SegmentRow[] {
  const db = new Database(dbPath, { readonly: true });
  try {
    const sql =
      "SELECT id, title, performance FROM segments ORDER BY performance, title";
    return db.query(sql).all() as SegmentRow[];
  } finally {
    db.close();
  }
}

// ---------------------------------------------------------------------------
// Playlist
// ---------------------------------------------------------------------------
const CHUNK_RE = /^(\S+\.ts)$/;

function playlistChunks(text: string): string[] {
  const chunks: string[] = [];
  for (const line of text.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    if (CHUNK_RE.test(trimmed)) chunks.push(trimmed);
  }
  return chunks;
}

// ---------------------------------------------------------------------------
// MPEG-TS / PES scan
// ---------------------------------------------------------------------------
function readTimestamp33(buf: Uint8Array, i: number): number {
  return (
    ((buf[i] >> 1) & 0x07) * 0x40000000 +
    (buf[i + 1] << 22) +
    (((buf[i + 2] >> 1) & 0x7f) << 15) +
    (buf[i + 3] << 7) +
    (buf[i + 4] >> 1)
  );
}

function streamKind(streamId: number): string {
  if (streamId >= 0xe0 && streamId <= 0xef) return "video";
  if (streamId >= 0xc0 && streamId <= 0xdf) return "audio";
  return `stream 0x${streamId.toString(16)}`;
}

interface Anomaly {
  count: number;
  prev: number;
  cur: number;
}

interface GridAnomaly {
  count: number;
  at: number;
  delta: number;
  expected: number;
}

const AAC_SAMPLES_PER_FRAME = 1024;
const ADTS_SAMPLE_RATES = [
  96000, 88200, 64000, 48000, 44100, 32000, 24000, 22050, 16000, 12000, 11025,
  8000, 7350,
];
const GRID_TOLERANCE_TICKS = 2;

/**
 * Duration of one AAC frame in 90kHz ticks, read from the ADTS header that
 * starts the PES payload. Returns null when the payload is not ADTS.
 */
function aacFrameTicks(buf: Uint8Array, i: number): number | null {
  if (i + 2 >= buf.length) return null;
  if (buf[i] !== 0xff || (buf[i + 1] & 0xf0) !== 0xf0) return null;
  const rate = ADTS_SAMPLE_RATES[(buf[i + 2] >> 2) & 0x0f];
  if (!rate) return null;
  return (AAC_SAMPLES_PER_FRAME * DTS_CLOCK) / rate;
}

/**
 * Scans one transport-stream chunk and returns human readable defects:
 *
 *  - corrupt layout (empty file, bad sync byte, truncated to a partial packet)
 *  - timestamps that go backwards on a PID (DTS, or PTS when DTS is absent)
 *  - audio PES timestamps that are not on the AAC frame grid, i.e. a cut that
 *    landed between frames and left a sub-frame PTS offset. This is the
 *    defect measured in 3q6QD1 (audio PTS 30 ticks = 0.333ms early).
 */
function scanChunk(label: string, buf: Uint8Array): string[] {
  const reasons: string[] = [];

  if (buf.length === 0) return [`${label}: empty file`];
  if (buf.length % TS_PACKET_SIZE !== 0) {
    reasons.push(
      `${label}: size ${buf.length} is not a multiple of ${TS_PACKET_SIZE} (truncated?)`,
    );
  }

  const total = Math.floor(buf.length / TS_PACKET_SIZE);
  const lastTimestamp = new Map<number, number>();
  const kindByPid = new Map<number, string>();
  const backwards = new Map<number, Anomaly>();
  const offGrid = new Map<number, GridAnomaly>();
  let brokenSync = 0;

  for (let n = 0; n < total; n++) {
    const off = n * TS_PACKET_SIZE;
    if (buf[off] !== TS_SYNC_BYTE) {
      brokenSync++;
      continue;
    }

    const b1 = buf[off + 1];
    if ((b1 & 0x40) === 0) continue; // no payload unit start => no PES header

    const pid = ((b1 & 0x1f) << 8) | buf[off + 2];
    const afc = (buf[off + 3] >> 4) & 0x03;
    if ((afc & 0x01) === 0) continue; // adaptation field only

    let p = off + 4;
    if (afc & 0x02) p += 1 + buf[p]; // skip adaptation field
    if (p + 19 > off + TS_PACKET_SIZE) continue;

    // PES start code
    if (buf[p] !== 0x00 || buf[p + 1] !== 0x00 || buf[p + 2] !== 0x01) continue;

    const streamId = buf[p + 3];
    const ptsDtsFlags = (buf[p + 7] >> 6) & 0x03;
    if (ptsDtsFlags < 0x02) continue; // neither PTS nor DTS

    const pts = readTimestamp33(buf, p + 9);
    const ts = ptsDtsFlags === 0x03 ? readTimestamp33(buf, p + 14) : pts;
    const kind = streamKind(streamId);
    kindByPid.set(pid, kind);

    // 1. timestamps must strictly increase
    const prev = lastTimestamp.get(pid);
    if (prev !== undefined) {
      if (ts <= prev) {
        const record = backwards.get(pid);
        if (record) record.count++;
        else backwards.set(pid, { count: 1, prev, cur: ts });
      }

      // 2. audio PES boundaries must sit on the AAC frame grid
      if (kind === "audio") {
        const payloadStart = p + 9 + buf[p + 8];
        const frameTicks = aacFrameTicks(buf, payloadStart);
        if (frameTicks !== null) {
          const delta = ts - prev;
          const expected = Math.round(delta / frameTicks) * frameTicks;
          if (Math.abs(delta - expected) > GRID_TOLERANCE_TICKS && delta > 0) {
            const record = offGrid.get(pid);
            if (record) record.count++;
            else
              offGrid.set(pid, {
                count: 1,
                at: ts,
                delta,
                expected,
              });
          }
        }
      }
    }

    lastTimestamp.set(pid, ts);
  }

  if (brokenSync > 0) {
    reasons.push(`${label}: ${brokenSync} packet(s) without 0x47 sync byte`);
  }

  for (const [pid, record] of backwards) {
    const kind = kindByPid.get(pid) ?? "pid";
    reasons.push(
      `${label}: timestamps go backwards on ${kind} pid 0x${pid.toString(16)} ` +
        `(${(record.prev / DTS_CLOCK).toFixed(6)}s -> ${(record.cur / DTS_CLOCK).toFixed(6)}s, ` +
        `${record.count} occurrence(s))`,
    );
  }

  for (const [pid, record] of offGrid) {
    const kind = kindByPid.get(pid) ?? "audio";
    const deviation = record.delta - record.expected;
    reasons.push(
      `${label}: ${kind} PES timestamp off the AAC frame grid on pid 0x${pid.toString(16)} ` +
        `at ${(record.at / DTS_CLOCK).toFixed(6)}s ` +
        `(${deviation > 0 ? "+" : ""}${deviation} ticks = ${(deviation / 90).toFixed(3)}ms, ` +
        `${record.count} occurrence(s))`,
    );
  }

  return reasons;
}

// ---------------------------------------------------------------------------
// Per-segment validation
// ---------------------------------------------------------------------------
interface Verdict {
  reasons: string[];
  missing: boolean;
}

async function checkSegment(row: SegmentRow, opts: Options): Promise<Verdict> {
  const dir = path.join(opts.root, row.id);
  const playlistPath = path.join(dir, `output_${opts.res}.m3u8`);

  let playlistText: string;
  try {
    playlistText = await fs.promises.readFile(playlistPath, "utf-8");
  } catch {
    return { reasons: [`output_${opts.res}.m3u8 missing`], missing: true };
  }

  const chunks = playlistChunks(playlistText);
  if (chunks.length === 0) {
    return {
      reasons: [`output_${opts.res}.m3u8 lists no chunks`],
      missing: true,
    };
  }

  const limit =
    opts.chunks === "all"
      ? chunks.length
      : Math.min(opts.chunks, chunks.length);
  const reasons: string[] = [];

  for (let i = 0; i < limit; i++) {
    const chunkPath = path.join(dir, chunks[i]);
    let buf: Buffer;
    try {
      buf = await fs.promises.readFile(chunkPath);
    } catch {
      reasons.push(`${chunks[i]}: file missing`);
      continue;
    }
    reasons.push(...scanChunk(chunks[i], buf));
  }

  return { reasons, missing: false };
}

// ---------------------------------------------------------------------------
// Playback confirmation (only used with --confirm)
// ---------------------------------------------------------------------------
const TIMESTAMP_ERROR = /non monotonically increasing dts to muxer in stream (\d+): (-?\d+) >= (-?\d+)/;

function ffmpegAvailable(): boolean {
  return Bun.which("ffmpeg") !== null;
}

/**
 * Decodes the whole playlist with ffmpeg and returns the first timestamp
 * violation it reports, or null when the stream plays cleanly.
 *
 * The cheap TS scan above is intentionally sensitive (it flags any PES that
 * is not exactly on the AAC frame grid), which produces candidates that real
 * decoders accept. ffmpeg's own demuxer derives DTS from the PES timeline, so
 * this is the authoritative "would a player break here" check.
 */
async function confirmWithFfmpeg(playlistPath: string): Promise<string | null> {
  const proc = Bun.spawn(
    ["ffmpeg", "-hide_banner", "-v", "error", "-i", playlistPath, "-f", "null", "-"],
    { stdout: "ignore", stderr: "pipe" },
  );

  const [stderr, exitCode] = await Promise.all([
    new Response(proc.stderr).text(),
    proc.exited,
  ]);

  const violations = new Map<string, number>();
  for (const line of stderr.split("\n")) {
    const match = TIMESTAMP_ERROR.exec(line);
    if (!match) continue;
    const key = `stream ${match[1]}: ${match[2]} >= ${match[3]}`;
    violations.set(key, (violations.get(key) ?? 0) + 1);
  }

  if (violations.size > 0) {
    const [first, count] = [...violations.entries()][0];
    const extra = violations.size > 1 ? `, ${violations.size} distinct violations` : "";
    return `non-monotonically-increasing DTS (${first}${count > 1 ? ` ×${count}` : ""}${extra})`;
  }

  if (exitCode !== 0) {
    const detail = stderr.trim().split("\n").slice(-1)[0] ?? "";
    return `decode failed (exit ${exitCode})${detail ? `: ${detail}` : ""}`;
  }

  return null;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
interface Defective {
  performance: string;
  title: string;
  id: string;
  reasons: string[];
}

async function main(): Promise<void> {
  const opts = parseArgs(process.argv.slice(2));

  if (!fs.existsSync(opts.root)) fail(`media root not found: ${opts.root}`);
  if (opts.confirm && !ffmpegAvailable()) fail("--confirm needs ffmpeg in PATH");

  let rows: SegmentRow[];
  const dbPath = resolveDb(opts.db);
  if (!opts.quiet) console.log(`db:   ${dbPath}`);

  const all = loadSegments(dbPath);
  if (opts.ids.length > 0) {
    const wanted = new Set(opts.ids);
    rows = all.filter((row) => wanted.has(row.id));
    const found = new Set(rows.map((row) => row.id));
    for (const id of opts.ids) {
      if (!found.has(id))
        rows.push({ id, title: "(not in db)", performance: "(not in db)" });
    }
  } else if (opts.performances.length > 0) {
    const wanted = new Set(opts.performances);
    rows = all.filter((row) => wanted.has(row.performance));
  } else {
    rows = all;
  }

  rows = rows.slice(0, opts.limit);

  if (!opts.quiet) {
    console.log(`root: ${opts.root}`);
    console.log(`res:  ${opts.res}p   chunks: ${opts.chunks}`);
    console.log(`segments: ${rows.length}\n`);
  }

  const defective: Defective[] = [];
  const missing: Defective[] = [];
  const unconfirmed: Defective[] = [];
  let scanned = 0;
  let next = 0;

  const worker = async (): Promise<void> => {
    while (next < rows.length) {
      const row = rows[next++];
      const verdict = await checkSegment(row, opts);
      scanned++;

      if (verdict.missing) {
        missing.push({
          performance: row.performance,
          title: row.title,
          id: row.id,
          reasons: verdict.reasons,
        });
      } else if (verdict.reasons.length > 0) {
        const entry: Defective = {
          performance: row.performance,
          title: row.title,
          id: row.id,
          reasons: verdict.reasons,
        };

        let confirmed = true;
        if (opts.confirm) {
          const failure = await confirmWithFfmpeg(
            path.join(opts.root, row.id, `output_${opts.res}.m3u8`),
          );
          if (failure) entry.reasons.push(`ffmpeg: ${failure}`);
          else {
            unconfirmed.push(entry);
            confirmed = false;
          }
        }

        if (confirmed) {
          defective.push(entry);
          if (!opts.quiet) {
            console.log(
              `✗ ${row.performance} :: ${row.title} (${row.id}) [${entry.reasons.length}]`,
            );
            for (const reason of entry.reasons.slice(0, 4))
              console.log(`    ${reason}`);
            if (entry.reasons.length > 4) {
              console.log(`    … ${entry.reasons.length - 4} more`);
            }
          }
        }
      }

      if (!opts.quiet && scanned % 250 === 0) {
        console.log(
          `  … ${scanned}/${rows.length} scanned, ${defective.length} defective`,
        );
      }
    }
  };

  await Promise.all(
    Array.from({ length: Math.min(opts.concurrency, rows.length) }, () =>
      worker(),
    ),
  );

  defective.sort((a, b) =>
    a.performance === b.performance
      ? a.title.localeCompare(b.title)
      : a.performance.localeCompare(b.performance),
  );

  if (opts.includeMissing) {
    defective.push(...missing);
    defective.sort((a, b) =>
      a.performance === b.performance
        ? a.title.localeCompare(b.title)
        : a.performance.localeCompare(b.performance),
    );
  }

  console.log(`\nscanned ${scanned} segment(s)`);
  console.log(
    `defective: ${defective.length - (opts.includeMissing ? missing.length : 0)}`,
  );
  if (opts.confirm && unconfirmed.length > 0) {
    console.log(
      `dropped ${unconfirmed.length} candidate(s) that ffmpeg decodes cleanly` +
        ` (${unconfirmed.map((entry) => entry.id).join(", ")})`,
    );
  }
  if (missing.length > 0) {
    console.log(
      `not compiled (no output_${opts.res}.m3u8): ${missing.length}` +
        (opts.includeMissing ? " [included in output]" : ""),
    );
  }

  if (opts.out) {
    const payload = defective.map(({ performance, title, id, reasons }) => ({
      performance,
      title,
      id,
      reasons,
    }));
    fs.mkdirSync(path.dirname(opts.out), { recursive: true });
    fs.writeFileSync(opts.out, JSON.stringify(payload, null, 2) + "\n");
    console.log(
      `wrote ${payload.length} entr${payload.length === 1 ? "y" : "ies"} to ${opts.out}`,
    );
  }
}

await main();
