// src/db/generateSeed.ts
import { writeFileSync } from "fs";
import path from "path";

// Import your artist data array
import { data } from "../build/compiler/artistData.js";

function buildSeedSql(): string {
  let sql = `-- Auto-generated seed file\n`;

  for (const item of data) {
    const id = item.id.replace(/'/g, "''");
    const artistId = item.artistId.replace(/'/g, "''");
    const title = item.title.replace(/'/g, "''");
    const artistName = item.artistName.replace(/'/g, "''");
    const eventDate = item.eventDate.replace(/'/g, "''");
    const venueName = item.venueName.replace(/'/g, "''");
    const indexVal = item.index.replace(/'/g, "''");
    const hash = item.hash.replace(/'/g, "''");
    const performance = item.performance.replace(/'/g, "''");
    const status = (item.status || "private").replace(/'/g, "''");

    sql += `INSERT OR REPLACE INTO segments (id, artistId, title, artistName, eventDate, venueName, "index", startTime, duration, hash, performance, status) VALUES ('${id}', '${artistId}', '${title}', '${artistName}', '${eventDate}', '${venueName}', '${indexVal}', ${item.startTime}, ${item.duration}, '${hash}', '${performance}', '${status}');\n`;
  }

  return sql;
}

const sqlContent = buildSeedSql();
const outputPath = path.resolve("seed.sql");
writeFileSync(outputPath, sqlContent, "utf-8");

console.log(`✅ Generated seed.sql with ${data.length} records.`);
