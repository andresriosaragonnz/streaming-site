import { rebuildPages } from "./rebuildPages";

const THIRTY_DAYS_SEC = 2_592_000;
const D1_BATCH_LIMIT = 80; // Hard limit safety threshold (D1 max is 100)

export const commitStatus = async (c: any) => {
  const { segments, changedStatus } = await c.req.json();
  const artist = segments[0]?.artistId;

  // Calculate timestamp at invocation time
  const now = Math.floor(Date.now() / 1000);

  try {
    // 1. Prepare segment status and title updates
    const updateStatements = (segments || []).map((seg: any) =>
      c.env.DB.prepare(
        `UPDATE segments SET status = ?, title = ? WHERE id = ?`,
      ).bind(seg.status, seg.title, seg.id),
    );

    // 2. Update published_at if NULL, 0, or older than 30 days
    const publishStatements = (changedStatus || []).map((id: string | number) =>
      c.env.DB.prepare(
        `
        UPDATE segments 
        SET published_at = ?
        WHERE id = ? 
          AND (
            published_at IS NULL 
            OR published_at = 0 
            OR (? - published_at) >= ?
          )
      `,
      ).bind(now, id, now, THIRTY_DAYS_SEC),
    );

    // 3. Combine both statement sets into a unified list
    const statements = [...updateStatements, ...publishStatements];

    // 4. Safely process statements in chunks under D1 batch limits
    if (statements.length > 0) {
      for (let i = 0; i < statements.length; i += D1_BATCH_LIMIT) {
        const chunk = statements.slice(i, i + D1_BATCH_LIMIT);
        await c.env.DB.batch(chunk);
      }
    }

    // 5. Trigger background page regeneration safely with error logging
    if (artist) {
      c.executionCtx.waitUntil(
        (async () => {
          try {
            console.log(
              `⚡ [Commit] Triggering background page rebuild via rebuildPages...`,
            );
            const { pagesCount, totalTimeMs } = await rebuildPages(c.env);
            console.log(
              `✅ [Commit] Rebuilt ${pagesCount} pages in ${totalTimeMs}ms`,
            );
          } catch (err) {
            console.error(
              `❌ [Commit] Background rebuild failed in waitUntil:`,
              err,
            );
          }
        })(),
      );
    }

    return c.json({
      status: "ok",
      message: `Updated ${statements.length} operation(s) successfully`,
    });
  } catch (error) {
    console.error("❌ Failed to update D1 database:", error);
    return c.json(
      { status: "error", message: "Database transaction failed" },
      500,
    );
  }
};
