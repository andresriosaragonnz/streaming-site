// src/index.ts
import { Hono } from "hono";
import { cors } from "hono/cors";

export interface Env {
  DB: D1Database;
}

const app = new Hono<{ Bindings: Env }>();

app.use("*", cors());

// GET /api/segments - Fetch all segments
app.get("/api/segments", async (c) => {
  try {
    // Works with Cloudflare D1 in production / Wrangler local execution
    const { results } = await c.env.DB.prepare("SELECT * FROM segments").all();
    return c.json({ success: true, segments: results });
  } catch (err: any) {
    return c.json({ success: false, error: err.message }, 500);
  }
});

app.get("/playlist", async (c) => {
  const shareData = c.req.query("share");

  if (!shareData) {
    return c.json({ success: false, error: "Missing share parameter" }, 400);
  }

  try {
    // 1. Restore Base64 padding and URL-safe characters
    let base64 = shareData.replace(/-/g, "+").replace(/_/g, "/");
    while (base64.length % 4) {
      base64 += "=";
    }

    // 2. Decode Base64 to string and split into ID array
    const decodedString = atob(base64);
    const decodedIds = decodedString
      .split(",")
      .map((id) => id.trim())
      .filter(Boolean);

    if (decodedIds.length === 0) {
      return c.json({ success: true, segments: [] });
    }

    // 3. Construct dynamic placeholders for SQL IN clause: (?, ?, ?)
    const placeholders = decodedIds.map(() => "?").join(", ");
    const query = `SELECT * FROM segments WHERE id IN (${placeholders})`;

    // 4. Query D1 passing the array of IDs as parameters
    const statement = c.env.DB.prepare(query).bind(...decodedIds);
    const { results } = await statement.all();

    return c.json(results);
    return c.html(fullPageHtml);
  } catch (err: any) {
    return c.json(
      { success: false, error: "Invalid share token or server error" },
      500,
    );
  }
});

// POST /api/commit-status - Placeholder for committing batch status changes
app.post("/api/commit-status", async (c) => {
  const body = await c.req.json().catch(() => ({}));

  // PLACEHOLDER FUNCTION: Will implement batch status update transaction in next step
  console.log("🚀 [Placeholder] Commit status changes triggered:", body);

  return c.json({
    success: true,
    message: "Status change commit placeholder executed successfully.",
    changedCount: Array.isArray(body?.changed) ? body.changed.length : 0,
  });
});

export default app;

// // Trigger background updates using waitUntil to respond immediately
// c.executionCtx.waitUntil(
//   (async () => {
//     for (const slug of updatedSegments) {
//       console.log(`[Rebuilding] Segment: ${slug}...`);

//       try {
//         const freshHtml = await compilePublicPerformances({ slug });
//         await c.env.PAGE_CACHE.put(`segment:${slug}`, freshHtml);
//         console.log(
//           `[KV Updated] Key "segment:${slug}" refreshed successfully.`,
//         );
//       } catch (err) {
//         console.error(`[Rebuild Failed] Segment: ${slug}`, err);
//       }
//     }
//   })(),
// );
