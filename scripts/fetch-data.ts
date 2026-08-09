import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

// Name of your Cloudflare D1 database (as configured in wrangler.toml)
const DB_NAME = "db";
const OUTPUT_FILE = path.resolve("data.json");

console.log(`🌐 Querying remote D1 database (${DB_NAME})...`);

try {
  // Execute SELECT query remotely and request output in JSON format
  const stdout = execSync(
    `npx wrangler d1 execute ${DB_NAME} --remote --command="SELECT * FROM segments" --json`,
    { encoding: "utf-8", stdio: ["pipe", "pipe", "ignore"] },
  );

  // Wrangler outputs an array of query results: [{ results: [...], success: true }]
  const rawParsed = JSON.parse(stdout);

  if (!rawParsed || !rawParsed[0] || !rawParsed[0].results) {
    throw new Error(
      "No results returned or invalid response structure from Wrangler.",
    );
  }

  const rows = rawParsed[0].results;

  // Save raw segment objects directly into data.json
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(rows, null, 2), "utf-8");

  console.log(`✅ Downloaded ${rows.length} segments to ${OUTPUT_FILE}`);
} catch (error) {
  console.error("❌ Failed to fetch data from remote D1:", error.message);
  process.exit(1);
}
