import { renderPublicEcosystem } from "../compiler/public/renderPublicEcosystem/renderPublicEcosystem";
import { savePagesToTarget } from "./savePagesToTarget";

const now = Math.floor(Date.now() / 1000);
const THIRTY_DAYS_SEC = 2_592_000;
export const commitStatus = async (c: any) => {
  const { segments, changedStatus } = await c.req.json();
  const artist = segments[0].artistId;

  try {
    const updateStatements = segments.map((seg: any) =>
      c.env.DB.prepare(
        `UPDATE segments SET status = ?, title = ? WHERE id = ?`,
      ).bind(seg.status, seg.title, seg.id),
    );

    // 2. Separate query batch for changedStatus IDs to update published_at with 30-day guard
    const publishStatements = (changedStatus || []).map((id: string | number) =>
      c.env.DB.prepare(
        `
        UPDATE segments 
        SET published_at = ?
        WHERE id = ? 
          AND (published_at IS NULL OR (? - published_at) >= ?)
      `,
      ).bind(now, id, now, THIRTY_DAYS_SEC),
    );

    // 3. Combine both statement sets into a single atomic batch transaction
    const statements = [...updateStatements, ...publishStatements];

    if (statements.length > 0) {
      // Execute all updates atomically in a single batch call
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
