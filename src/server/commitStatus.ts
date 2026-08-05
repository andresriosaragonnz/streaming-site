import { renderPublicEcosystem } from "../compiler/public/renderPublicEcosystem/renderPublicEcosystem";
import { savePagesToTarget } from "./savePagesToTarget";

export const commitStatus = async (c: any) => {
  const { segments } = await c.req.json();
  const artist = segments[0].artistId;

  try {
    // 3. Execute both updates in a single atomic batch transaction
    // Map each segment to its own UPDATE statement
    const statements = segments.map((seg: any) =>
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
        // Write re-compiled pages directly to D1 table asynchronously
        await savePagesToTarget(c.env, kvPairs);
        console.log(
          `Found ${results.length} segments. Compiling pages to D1...`,
        );
      })(),
    );

    return c.json({
      status: "ok",
      message: `Updated segment(s)`,
    });
  } catch (error) {
    console.error("❌ Failed to update D1 database:", error);
    return c.json(
      { status: "error", message: "Database transaction failed" },
      500,
    );
  }
};
