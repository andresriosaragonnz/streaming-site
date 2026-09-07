Step-by-step setup for a new Cloudflare Worker with a dedicated KV namespace and D1 database. Step 1: Create the Remote ResourcesRun these commands in a separate terminal tab:Bash# 1. Create new D1 Database
bunx wrangler d1 create <NEW_DB_NAME>

# 2. Create new KV Namespace

bunx wrangler kv namespace create <NEW_KV_NAME>
Wrangler will output snippet configuration blocks containing generated database_id and id keys upon creation.Step 2: Update wrangler.jsonc (or wrangler.toml)Update the bindings in your Cloudflare configuration file to point to your new resource IDs:Code snippet{
"name": "my-new-worker-name",
"main": "src/index.ts",
"compatibility_date": "2026-09-01",

"d1_databases": [
{
"binding": "DB",
"database_name": "<NEW_DB_NAME>",
"database_id": "<PASTE_D1_DATABASE_ID_HERE>"
}
],

"kv_namespaces": [
{
"binding": "KV",
"id": "<PASTE_KV_NAMESPACE_ID_HERE>"
}
]
}
Step 3: Run Database Migrations or Schema SetupExecute your schema file or migrations against the new remote D1 instance:Bash# Ingest local schema file
bunx wrangler d1 execute <NEW_DB_NAME> --remote --file=./schema.sql

# Or run Wrangler migrations

bunx wrangler d1 migrations apply <NEW_DB_NAME> --remote
Step 4: Deploy the WorkerDeploy your updated bundle to Cloudflare:Bashbunx wrangler deploy
