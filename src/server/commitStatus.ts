import { rebuildPages } from "./rebuildPages";
import { getAuthPayload, hasArtistAccess, isAdminRequest } from "./auth";

const THIRTY_DAYS_SEC = 2_592_000;
const D1_BATCH_LIMIT = 80; // Hard limit safety threshold (D1 max is 100)
const MAX_SEGMENTS_PER_COMMIT = 100;

const VALID_STATUSES = new Set(["public", "private"]);

interface IncomingSegment {
  id: string;
  title: string;
  status: string;
}

export const commitStatus = async (c: any) => {
  c.header("Cache-Control", "no-store");
  const admin = isAdminRequest(c);
  const payload = admin ? null : await getAuthPayload(c);

  if (!admin && !payload) {
    return c.text("Unauthorized", 401);
  }

  let body: any;
  try {
    body = await c.req.json();
  } catch {
    return c.json({ status: "error", message: "Invalid JSON body" }, 400);
  }

  const rawSegments = Array.isArray(body?.segments) ? body.segments : [];
  if (rawSegments.length === 0) {
    return c.json({ status: "error", message: "No segments provided" }, 400);
  }
  if (rawSegments.length > MAX_SEGMENTS_PER_COMMIT) {
    return c.json(
      { status: "error", message: "Too many segments in one commit" },
      400,
    );
  }

  const segments: IncomingSegment[] = [];
  for (const raw of rawSegments) {
    if (
      !raw ||
      typeof raw.id !== "string" ||
      raw.id.length === 0 ||
      typeof raw.title !== "string" ||
      raw.title.length > 200 ||
      typeof raw.status !== "string" ||
      !VALID_STATUSES.has(raw.status)
    ) {
      return c.json(
        { status: "error", message: "Invalid segment payload" },
        400,
      );
    }

    segments.push({ id: raw.id, title: raw.title, status: raw.status });
  }

  const ids = Array.from(new Set(segments.map((segment) => segment.id)));
  const placeholders = ids.map(() => "?").join(", ");

  const { results } = await c.env.DB.prepare(
    `SELECT s.id, s.artistId, a.token_version
     FROM segments s
     LEFT JOIN artists a ON a.id = s.artistId
     WHERE s.id IN (${placeholders})`,
  )
    .bind(...ids)
    .all();

  const rows = (results || []) as Array<{
    id: string;
    artistId: string;
    token_version: number | null;
  }>;

  const rowsById = new Map(rows.map((row) => [row.id, row]));

  for (const id of ids) {
    const row = rowsById.get(id);
    if (!row) {
      return c.json(
        { status: "error", message: "Unknown segment in commit" },
        400,
      );
    }

    if (
      !admin &&
      !hasArtistAccess(payload, row.artistId, row.token_version)
    ) {
      return c.text("Forbidden: segment does not belong to this artist", 403);
    }
  }

  const allowedIds = new Set(ids);
  const changedStatus = Array.isArray(body?.changedStatus)
    ? body.changedStatus
    : [];
  const changedIds = Array.from(
    new Set(
      changedStatus
        .map((value: unknown) => String(value))
        .filter((id: string) => allowedIds.has(id)),
    ),
  );

  const now = Math.floor(Date.now() / 1000);

  try {
    // 1. Prepare segment status and title updates
    const updateStatements = segments.map((segment) =>
      c.env.DB.prepare(
        `UPDATE segments SET status = ?, title = ? WHERE id = ?`,
      ).bind(segment.status, segment.title, segment.id),
    );

    // 2. Update published_at if NULL, 0, or older than 30 days
    const publishStatements = changedIds.map((id) =>
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

    const statements = [...updateStatements, ...publishStatements];

    // 3. Safely process statements in chunks under D1 batch limits
    for (let i = 0; i < statements.length; i += D1_BATCH_LIMIT) {
      await c.env.DB.batch(statements.slice(i, i + D1_BATCH_LIMIT));
    }

    // 4. Trigger background network-graph regeneration safely
    if (rows && rows.length > 0) {
      try {
        c.executionCtx.waitUntil(
          (async () => {
            try {
              const { totalTimeMs } = await rebuildPages(c.env);
              console.log(
                `✅ [Commit] Rebuilt network graph in ${totalTimeMs}ms`,
              );
            } catch (err) {
              console.error("[Commit] Background rebuild failed:", err);
            }
          })(),
        );
      } catch {
        // Some runtimes (for example unit-test contexts) do not expose
        // executionCtx. The commit itself has already succeeded.
      }
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
