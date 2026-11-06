import { rebuildPages } from "./rebuildPages";
import { getAuthPayload, hasArtistAccess, isAdminRequest } from "./auth";

const THIRTY_DAYS_SEC = 2_592_000;
const D1_BATCH_LIMIT = 80; // Hard limit safety threshold (D1 max is 100)
const MAX_SEGMENTS_PER_COMMIT = 100;
const MAX_TITLE_LENGTH = 200;
const SEGMENT_ID_PATTERN = /^[A-Za-z0-9_-]{1,64}$/;

type SegmentStatus = "public" | "private";

interface CommitSegment {
  id: string;
  title: string;
  status: SegmentStatus;
}

interface CommitPayload {
  segments: CommitSegment[];
  changedStatus: string[];
}

type ParseResult =
  | { ok: true; value: CommitPayload }
  | { ok: false; message: string };

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const isSegmentStatus = (value: unknown): value is SegmentStatus =>
  value === "public" || value === "private";

/**
 * Native runtime validation for the commit request.
 *
 * Bun does not ship a schema validator, so this uses plain type guards and
 * returns a fully typed payload. The handler only deals with valid data.
 */
const parseCommitPayload = (body: unknown): ParseResult => {
  if (!isRecord(body)) {
    return { ok: false, message: "Invalid commit payload" };
  }

  const { segments: rawSegments, changedStatus: rawChangedStatus } = body;

  if (!Array.isArray(rawSegments) || rawSegments.length === 0) {
    return { ok: false, message: "No segments provided" };
  }

  if (rawSegments.length > MAX_SEGMENTS_PER_COMMIT) {
    return { ok: false, message: "Too many segments in one commit" };
  }

  const segments: CommitSegment[] = [];

  for (const rawSegment of rawSegments) {
    if (!isRecord(rawSegment)) {
      return { ok: false, message: "Invalid segment payload" };
    }

    const { id, title, status } = rawSegment;

    if (
      typeof id !== "string" ||
      !SEGMENT_ID_PATTERN.test(id) ||
      typeof title !== "string" ||
      title.length > MAX_TITLE_LENGTH ||
      !isSegmentStatus(status)
    ) {
      return { ok: false, message: "Invalid segment payload" };
    }

    segments.push({ id, title, status });
  }

  let changedStatus: string[] = [];
  if (rawChangedStatus !== undefined) {
    if (
      !Array.isArray(rawChangedStatus) ||
      rawChangedStatus.length > MAX_SEGMENTS_PER_COMMIT ||
      !rawChangedStatus.every((value) => typeof value === "string")
    ) {
      return { ok: false, message: "Invalid changedStatus payload" };
    }
    changedStatus = rawChangedStatus;
  }

  return { ok: true, value: { segments, changedStatus } };
};

export const commitStatus = async (c: any) => {
  c.header("Cache-Control", "no-store");

  const admin = isAdminRequest(c);
  const payload = admin ? null : await getAuthPayload(c);
  if (!admin && !payload) {
    return c.text("Unauthorized", 401);
  }

  let body: unknown;
  try {
    body = await c.req.json();
  } catch {
    return c.json({ status: "error", message: "Invalid JSON body" }, 400);
  }

  const parsed = parseCommitPayload(body);
  if (!parsed.ok) {
    return c.json({ status: "error", message: parsed.message }, 400);
  }

  const { segments, changedStatus } = parsed.value;
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

  if (ids.some((id) => !rowsById.has(id))) {
    return c.json(
      { status: "error", message: "Unknown segment in commit" },
      400,
    );
  }

  if (!admin) {
    const forbidden = ids.some((id) => {
      const row = rowsById.get(id);
      return (
        !row || !hasArtistAccess(payload, row.artistId, row.token_version)
      );
    });

    if (forbidden) {
      return c.text("Forbidden: segment does not belong to this artist", 403);
    }
  }

  const allowedIds = new Set(ids);
  const changedIds = Array.from(new Set(changedStatus)).filter((id) =>
    allowedIds.has(id),
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
    if (rows.length > 0) {
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
