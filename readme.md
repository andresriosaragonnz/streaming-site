# Example TOML

```
name = "poc-backend"
main = "src/index.ts"
compatibility_date = "2026-01-01"
compatibility_flags = ["nodejs_compat"]

# Serve static files from the ./public directory at the Cloudflare Edge
[assets]
directory = "./public"
binding = "ASSETS"

[[d1_databases]]
binding = "DB"
database_name = "db"
database_id = "f3d47265-97b0-4399-b0d0-3761b522e680" # Created via: npx wrangler d1 create studio-db

[[kv_namespaces]]
binding = "PAGE_CACHE"
id = "62705a56a0f745e985b2d712e8653903"
# Put a placeholder or real KV ID here

```

### deploy KV store

```
npx wrangler kv namespace create PAGE_CACHE
```

### deploy db

```
npx wrangler d1 execute DB --remote --file=./schema.sql
npx wrangler d1 execute DB --remote --file=./seed.sql
# Check rows in table 1
npx wrangler d1 execute DB --remote --command="SELECT COUNT(*) FROM your_table_one"

```

### Run local logs

```
npx wrangler tail --format=pretty

npx wrangler tail --status=error

```
