import { Hono } from "hono";
import { renderPrivatePerformance } from "./compiler/private/renderPrivatePerformance/renderPrivatePerformance";
import { renderPrivateDashboard } from "./compiler/private/renderPrivateDashboard/renderPrivateDashboard";
import { renderPublicPerformance } from "./compiler/public/renderPublicPerformance/renderPublicPerformance";
import { renderPublicEcosystem } from "./compiler/public/renderPublicEcosystem/renderPublicEcosystem";
import { formatSegments } from "./compiler/formatSegments/index.js";

// Define the Cloudflare KV binding type
type Bindings = {
  PAGE_CACHE: KVNamespace;
};

const app = new Hono<{ Bindings: Bindings }>();

app.get("/private/performance/:slug", async (c) => {
  const slug = c.req.param("slug");
  const cacheKey = `private-${slug}`;
  const sql = `SELECT * FROM segments WHERE performance = ?`;
  const { results } = await c.env.DB.prepare(sql).bind(slug).all();
  const html = renderPrivatePerformance(results);
  return c.html(html);
});

app.get("/playlist", async (c) => {
  let shareParam = c.req.query("share");
  if (!shareParam) {
    return c.text("Missing share parameter", 400);
  }
  try {
    // 2. Normalize base64url encoding (replace URL-safe chars back to standard base64)
    shareParam = shareParam.replace(/-/g, "+").replace(/_/g, "/");
    while (shareParam.length % 4) {
      shareParam += "=";
    }

    // 3. Decode base64 to plain text ID string (e.g., "id1,id2,id3")
    const decodedString = atob(shareParam);
    const ids = decodedString.split(",").filter(Boolean);

    if (ids.length === 0) {
      return c.text("Invalid playlist IDs", 400);
    }

    // 4. Construct SQL statement with placeholders for dynamic IN clause
    const placeholders = ids.map(() => "?").join(", ");
    const sql = `SELECT * FROM segments WHERE id IN (${placeholders}) AND status = 'public'`;

    // 5. Query D1 with bound IDs
    const { results } = await c.env.DB.prepare(sql)
      .bind(...ids)
      .all();

    // 6. Render and return HTML page
    console.log(results);
    const html = renderPublicPerformance({ segments: formatSegments(results) });
    return c.html(html);
  } catch (err) {
    console.error("Failed to parse playlist share parameter:", err);
    return c.text("Invalid share payload", 400);
  }
});

app.get("/private/:slug", async (c) => {
  const slug = c.req.param("slug");
  const cacheKey = `private-${slug}`;
  const sql = `SELECT * FROM segments WHERE artistId = ?`;
  const { results } = await c.env.DB.prepare(sql).bind(slug).all();
  const html = renderPrivateDashboard(results);
  // let html = (await c.env.PAGE_CACHE.get(cacheKey)) || "error";
  return c.html(html);
});

app.get("/performance/:slug", async (c) => {
  const slug = c.req.param("slug");
  const sql = `SELECT * FROM segments WHERE performance = ?`;
  const { results } = await c.env.DB.prepare(sql).bind(slug).all();
  const html = renderPublicPerformance(results);
  return c.html(html);
});

app.get("/:slug", async (c) => {
  const slug = c.req.param("slug");
  const found = await c.env.PAGE_CACHE.get(slug);
  console.log({ found });
  const html = found || "";
  return c.html(html);
});

app.post("/api/commit-status", async (c) => {
  const { segments } = await c.req.json();
  const artist = segments[0].artistId;

  try {
    // 3. Execute both updates in a single atomic batch transaction
    // Map each segment to its own UPDATE statement
    const statements = segments.map((seg) =>
      c.env.DB.prepare(
        `UPDATE segments SET status = ?, title = ? WHERE id = ?`,
      ).bind(seg.status, seg.title, seg.id),
    );

    // Execute all updates atomically in a single batch call
    if (statements.length > 0) {
      await c.env.DB.batch(statements);
    }

    c.executionCtx.waitUntil(
      (async () => {
        const sql = `SELECT * FROM segments WHERE artistId = ?`;
        const { results } = await c.env.DB.prepare(sql).bind(artist).all();
        const kvPairs = renderPublicEcosystem(results);
        await Promise.all(
          kvPairs.map(({ key, value }) => c.env.PAGE_CACHE.put(key, value)),
        );
        console.log(`Found ${results.length} segments. Compiling pages...`);
      })(),
    );

    return c.json({
      status: "ok",
      message: `Updated  segment(s)`,
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
