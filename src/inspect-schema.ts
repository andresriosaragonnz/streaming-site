import { Database } from "bun:sqlite";
import path from "path";
import fs from "fs";

const DB_PATH = path.join(import.meta.dir, "../web.db");
const OUTPUT_PATH = path.join(import.meta.dir, "../schema.json");

// Initialize Bun's native SQLite driver
const db = new Database(DB_PATH, { readonly: true });

console.log(`🔍 Extracting schema from: ${DB_PATH}...`);

interface SqliteMasterRow {
  type: string;
  name: string;
  tbl_name: string;
  sql: string;
}

// 1. Grab all user-defined database tables
const tables = db
  .query<SqliteMasterRow, []>(
    `SELECT type, name, tbl_name, sql 
   FROM sqlite_master 
   WHERE type='table' AND name NOT LIKE 'sqlite_%'`,
  )
  .all();

if (tables.length === 0) {
  console.log("⚠️ No tables found. Output file was not generated.");
  db.close();
  process.exit(0);
}

// 2. Map structural catalog arrays into a structured map dictionary
const schemaDump: Record<string, { rawSql: string; columns: any[] }> = {};

tables.forEach((table) => {
  // Query table info PRAGMA to get structured column layouts (CID, Name, Type, NotNull, Dflt_Value, PK)
  const columns = db.query(`PRAGMA table_info("${table.name}")`).all();

  schemaDump[table.name] = {
    rawSql: table.sql.trim(),
    columns: columns,
  };
});

// 3. Write structured JSON tree out cleanly formatted
fs.writeFileSync(OUTPUT_PATH, JSON.stringify(schemaDump, null, 2), "utf8");

console.log(`✨ Success! Database blueprint saved safely to: ${OUTPUT_PATH}`);

db.close();
