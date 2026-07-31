import { Database } from "bun:sqlite";
import { globSync, rmSync } from "node:fs";
import { readdirSync, statSync } from "node:fs";
import { join, resolve } from "node:path";
import { compileArtistPages } from "../src/build/compiler/index";

import { execSync } from "node:child_process";
import { writeFileSync, unlinkSync } from "node:fs";

export function getLocalD1Database(): Database {
  // Target directory where Miniflare stores D1 databases
  const d1Dir = resolve(
    process.cwd(),
    ".wrangler/state/v3/d1/miniflare-D1DatabaseObject",
  );

  const files = readdirSync(d1Dir);

  // 2. Filter for hash-named .sqlite files (64-char hex SHA-256)
  // Excludes metadata.sqlite and non-database files
  const hashSqliteFiles = files
    .filter((file) => /^[a-f0-9]{64}\.sqlite$/i.test(file))
    .map((file) => join(d1Dir, file));

  // Pick the most recently modified database file
  const targetDbPath = hashSqliteFiles.sort(
    (a, b) => statSync(b).mtimeMs - statSync(a).mtimeMs,
  )[0];
  return new Database(targetDbPath);
}

async function bulkCompileAndSyncSegments() {
  console.log("Fetching all database segments with Bun SQLite...");
  console.time("fetch-fast");
  // Fetch all segments in JSON format
  const db = getLocalD1Database();
  const segments = db.query("SELECT * FROM segments").all();
  const bulkPayload = compileArtistPages(segments);

  console.log(`Found ${segments.length} segments. Compiling pages...`);
  // console.log(bulkPayload);
  console.timeEnd("fetch-fast");

  // 3. Save JSON payload using Bun's native file API
  const payloadPath = "./kv-bulk-payload.json";
  await Bun.write(payloadPath, JSON.stringify(bulkPayload, null, 2));
  console.log(`Generated bulk payload for ${bulkPayload.length} segments.`);

  // 4. Batch upload to Cloudflare KV via Wrangler
  const isDev = process.env.NODE_ENV !== "production";
  const targetFlag = isDev ? "--local" : "";
  // nullifyAndClearKV();
  execSync(
    `npx wrangler kv bulk put ${payloadPath} --binding=PAGE_CACHE ${targetFlag}`,
    {
      stdio: "inherit",
    },
  );

  // // Clean up temporary file
  // const payloadFile = Bun.file(payloadPath);
  // (await payloadFile.delete?.()) || execSync(`rm -f ${payloadPath}`);

  console.log("Bulk sync complete!");
}

bulkCompileAndSyncSegments().catch(console.error);
