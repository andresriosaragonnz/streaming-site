import { Hono } from "hono";
import { compileArtistPages } from "./build/compiler/index";

// Define the Cloudflare KV binding type
type Bindings = {
  PAGE_CACHE: KVNamespace;
};

const app = new Hono<{ Bindings: Bindings }>();

app.get("/private/:slug", async (c) => {
  const slug = c.req.param("slug");
  const cacheKey = `private-${slug}`;
  let html = (await c.env.PAGE_CACHE.get(cacheKey)) || "error";
  return c.html(html);
});

app.get("/:slug", async (c) => {
  const slug = c.req.param("slug");
  let html = (await c.env.PAGE_CACHE.get(slug)) || "error";
  return c.html(html);
});

app.post("/api/commit-status", async (c) => {
  const { privateIds = [], publicIds = [], artist } = await c.req.json();
  // Guard: If no changes were submitted, return early
  if (privateIds.length === 0 && publicIds.length === 0) {
    return c.json({ status: "ok", message: "No updates provided" });
  }

  const statements = [];

  // 1. Prepare UPDATE for private segments
  if (privateIds.length > 0) {
    const placeholders = privateIds.map(() => "?").join(", ");
    const sql = `UPDATE segments SET status = 'private' WHERE id IN (${placeholders})`;
    statements.push(c.env.DB.prepare(sql).bind(...privateIds));
  }

  // 2. Prepare UPDATE for public segments
  if (publicIds.length > 0) {
    const placeholders = publicIds.map(() => "?").join(", ");
    const sql = `UPDATE segments SET status = 'public' WHERE id IN (${placeholders})`;
    statements.push(c.env.DB.prepare(sql).bind(...publicIds));
  }

  try {
    // 3. Execute both updates in a single atomic batch transaction
    await c.env.DB.batch(statements);

    const totalUpdated = privateIds.length + publicIds.length;
    console.log(`✅ Successfully updated ${totalUpdated} segment(s) in D1.`);
    c.executionCtx.waitUntil(
      (async () => {
        const sql = `SELECT * FROM segments WHERE artistId = ?`;
        const { results } = await c.env.DB.prepare(sql).bind(artist).all();
        console.log({ results });
        const bulkPayload = compileArtistPages(results);

        console.log(`Found ${results.length} segments. Compiling pages...`);
        console.log(bulkPayload);
      })(),
    );

    return c.json({
      status: "ok",
      message: `Updated ${totalUpdated} segment(s)`,
      updated: { privateIds, publicIds },
    });
  } catch (error) {
    console.error("❌ Failed to update D1 database:", error);
    return c.json(
      { status: "error", message: "Database transaction failed" },
      500,
    );
  }
});

app.get("/", (c) => {
  return c.html("<h1>Archive Engine Server Running</h1>");
});

export default app;
