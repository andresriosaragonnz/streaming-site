#!/usr/bin/env bun
/**
 * purge-cache.ts — local helper to purge the Cloudflare edge cache.
 *
 * Usage:
 *   bun scripts/purge-cache.ts                          # purge default tags
 *   bun scripts/purge-cache.ts --tag playlist
 *   bun scripts/purge-cache.ts --tag artist:slug --tag public-feed
 *   bun scripts/purge-cache.ts --url "https://example.org/playlist?share=..."
 *   bun scripts/purge-cache.ts --all --yes              # nukes the whole zone
 *   bun scripts/purge-cache.ts --tag playlist --dry-run # show payload only
 *
 * Credentials (env wins over .dev.vars / .env):
 *   CLOUDFLARE_ZONE_ID   zone id (not the account id)
 *   CLOUDFLARE_API_TOKEN token with "Zone -> Cache Purge" permission
 *
 * Flags:
 *   --tag <tag>    Cache-Tag value to purge (repeatable, max 30/request)
 *   --url <url>    absolute URL to purge (repeatable, max 30/request)
 *   --all          purge everything in the zone (requires --yes)
 *   --yes          skip the confirmation guard for --all
 *   --dry-run      print the request payload without sending it
 *   --zone <id>    override CLOUDFLARE_ZONE_ID
 *   --token <tok>  override CLOUDFLARE_API_TOKEN
 */

import fs from "node:fs";
import path from "node:path";

const API = "https://api.cloudflare.com/client/v4";
const MAX_TAGS_PER_REQUEST = 30;
const MAX_URLS_PER_REQUEST = 30;

const DEFAULT_TAGS = ["playlist", "public-feed"];

// ---------------------------------------------------------------------------
// Env loading (.dev.vars / .env are gitignored, process.env wins)
// ---------------------------------------------------------------------------
function parseEnvFile(file: string): Record<string, string> {
  const out: Record<string, string> = {};
  if (!fs.existsSync(file)) return out;

  for (const rawLine of fs.readFileSync(file, "utf-8").split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;

    const eq = line.indexOf("=");
    if (eq === -1) continue;

    const key = line.slice(0, eq).trim();
    let value = line.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (key) out[key] = value;
  }
  return out;
}

function loadEnv(): Record<string, string> {
  const merged: Record<string, string> = {};
  for (const name of [".env", ".dev.vars", ".env.local", ".dev.vars.local"]) {
    Object.assign(merged, parseEnvFile(path.resolve(name)));
  }
  return { ...merged, ...process.env } as Record<string, string>;
}

// ---------------------------------------------------------------------------
// Tiny arg parser
// ---------------------------------------------------------------------------
interface Options {
  tags: string[];
  urls: string[];
  all: boolean;
  yes: boolean;
  dryRun: boolean;
  zone?: string;
  token?: string;
}

function parseArgs(argv: string[]): Options {
  const opts: Options = {
    tags: [],
    urls: [],
    all: false,
    yes: false,
    dryRun: false,
  };

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];

    switch (arg) {
      case "--tag":
        opts.tags.push(requireValue(argv, ++i, "--tag"));
        break;
      case "--url":
        opts.urls.push(requireValue(argv, ++i, "--url"));
        break;
      case "--zone":
        opts.zone = requireValue(argv, ++i, "--zone");
        break;
      case "--token":
        opts.token = requireValue(argv, ++i, "--token");
        break;
      case "--all":
        opts.all = true;
        break;
      case "--yes":
      case "-y":
        opts.yes = true;
        break;
      case "--dry-run":
        opts.dryRun = true;
        break;
      case "--help":
      case "-h":
        printHelp();
        process.exit(0);
      default:
        fail(`Unknown argument: ${arg}\nRun with --help for usage.`);
    }
  }

  return opts;
}

function requireValue(argv: string[], index: number, flag: string): string {
  const value = argv[index];
  if (!value || value.startsWith("--")) {
    fail(`${flag} requires a value.`);
  }
  return value;
}

function printHelp() {
  console.log(
    [
      "bun scripts/purge-cache.ts [options]",
      "",
      "  --tag <tag>     Cache-Tag to purge (repeatable)",
      "  --url <url>     absolute URL to purge (repeatable)",
      "  --all           purge everything in the zone (needs --yes)",
      "  --yes           skip the --all confirmation",
      "  --dry-run       print the payload, send nothing",
      "  --zone <id>     override CLOUDFLARE_ZONE_ID",
      "  --token <tok>   override CLOUDFLARE_API_TOKEN",
      "",
      "Examples:",
      '  bun scripts/purge-cache.ts --tag playlist',
      '  bun scripts/purge-cache.ts --url "https://iknowthatband.org/playlist?share=abc&name=Favorites"',
      "  bun scripts/purge-cache.ts --all --yes",
    ].join("\n"),
  );
}

function fail(message: string): never {
  console.error(`\n✖ ${message}\n`);
  process.exit(1);
}

// ---------------------------------------------------------------------------
// Purge requests
// ---------------------------------------------------------------------------
type PurgeBody =
  | { tags: string[] }
  | { files: string[] }
  | { purge_everything: true };

interface PurgeResponse {
  success: boolean;
  errors?: { code: number; message: string }[];
  result?: { id: string };
}

function chunk<T>(items: T[], size: number): T[][] {
  const batches: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    batches.push(items.slice(i, i + size));
  }
  return batches;
}

async function sendPurge(
  zoneId: string,
  token: string,
  body: PurgeBody,
  dryRun: boolean,
): Promise<boolean> {
  const label = dryRun ? "DRY RUN" : "POST";
  console.log(`\n${label} ${API}/zones/${zoneId}/purge_cache`);
  console.log(JSON.stringify(body, null, 2));

  if (dryRun) return true;

  let response: Response;
  try {
    response = await fetch(`${API}/zones/${zoneId}/purge_cache`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });
  } catch (err) {
    console.error(`✖ Network error: ${(err as Error).message}`);
    return false;
  }

  const text = await response.text();
  let payload: PurgeResponse;
  try {
    payload = JSON.parse(text) as PurgeResponse;
  } catch {
    console.error(`✖ HTTP ${response.status} — non-JSON response:\n${text}`);
    return false;
  }

  if (!response.ok || !payload.success) {
    console.error(`✖ HTTP ${response.status} — purge failed`);
    for (const e of payload.errors ?? []) {
      console.error(`  [${e.code}] ${e.message}`);
    }
    if (response.status === 401 || response.status === 403) {
      console.error(
        "  Token is missing the 'Zone → Cache Purge' permission, or the zone id is wrong.",
      );
    }
    return false;
  }

  console.log(`✔ Purged (id: ${payload.result?.id ?? "n/a"})`);
  return true;
}

async function main() {
  const opts = parseArgs(process.argv.slice(2));
  const env = loadEnv();

  const zoneId = opts.zone || env.CLOUDFLARE_ZONE_ID || env.CF_ZONE_ID;
  const token =
    opts.token ||
    env.CLOUDFLARE_API_TOKEN ||
    env.CF_PURGE_TOKEN ||
    env.CLOUDFLARE_PURGE_TOKEN;

  if (!zoneId) {
    fail(
      "Missing CLOUDFLARE_ZONE_ID.\n" +
        "Add it to .dev.vars or pass --zone <id>.\n" +
        "Find it on the zone overview page in the Cloudflare dashboard.",
    );
  }
  if (!token) {
    fail(
      "Missing CLOUDFLARE_API_TOKEN.\n" +
        "Add it to .dev.vars or pass --token <token>.\n" +
        "The token needs the 'Zone → Cache Purge' permission for this zone.",
    );
  }
  if (opts.all && !opts.yes && !opts.dryRun) {
    fail("--all purges the entire zone. Re-run with --yes to confirm.");
  }
  if (opts.all && (opts.tags.length || opts.urls.length)) {
    fail("--all cannot be combined with --tag or --url.");
  }

  const tags = opts.tags.length ? opts.tags : opts.all || opts.urls.length ? [] : DEFAULT_TAGS;

  console.log(`zone: ${zoneId}`);
  if (opts.all) console.log("mode: purge everything");
  if (tags.length) console.log(`tags: ${tags.join(", ")}`);
  if (opts.urls.length) console.log(`urls: ${opts.urls.length}`);

  const results: boolean[] = [];

  if (opts.all) {
    results.push(await sendPurge(zoneId, token, { purge_everything: true }, opts.dryRun));
  }

  for (const batch of chunk(tags, MAX_TAGS_PER_REQUEST)) {
    results.push(await sendPurge(zoneId, token, { tags: batch }, opts.dryRun));
  }

  for (const batch of chunk(opts.urls, MAX_URLS_PER_REQUEST)) {
    for (const url of batch) {
      if (!/^https?:\/\//.test(url)) {
        fail(`--url must be absolute http(s): ${url}`);
      }
    }
    results.push(await sendPurge(zoneId, token, { files: batch }, opts.dryRun));
  }

  if (!results.length) {
    fail("Nothing to purge. Pass --tag, --url or --all.");
  }

  if (results.every(Boolean)) {
    console.log(
      opts.dryRun
        ? "\n✨ Dry run complete. Nothing was sent."
        : "\n✨ Cache purge request(s) accepted.",
    );
    return;
  }

  process.exit(1);
}

main().catch((err) => {
  console.error(`\n✖ Unexpected error: ${(err as Error).message}\n`);
  process.exit(1);
});
