import { getAuthPayload, hasArtistAccess } from "./auth";
import { UnauthorizedPageLayout } from "./serveUnauthorized";

/**
 * Guards `/private/performance/:slug`.
 *
 * The `slug` here is the performance identifier, not the artist slug, so the
 * artist must be derived from the segment rows before checking the token.
 */
export const usePrivatePerformance = async (c: any, next: any) => {
  const payload = await getAuthPayload(c);
  if (!payload) {
    return c.html("<!doctype html>\n" + <UnauthorizedPageLayout />, 401);
  }

  const performance = c.req.param("slug");
  if (!performance) {
    return c.text("Bad Request", 400);
  }

  const { results } = await c.env.DB.prepare(
    `SELECT DISTINCT s.artistId, a.id, a.token_version
     FROM segments s
     LEFT JOIN artists a ON a.id = s.artistId
     WHERE s.performance = ?`,
  )
    .bind(performance)
    .all();

  const artists = (results || []) as Array<{
    artistId: string;
    id: string | null;
    token_version: number | null;
  }>;

  if (artists.length === 0) {
    return c.text("Performance not found", 404);
  }

  // Every artist represented in the performance must be authorized, otherwise
  // an owner of one artist could read another artist's private segments.
  const isAllowed = artists.every(
    (artist) =>
      artist.id !== null &&
      hasArtistAccess(payload, artist.id, artist.token_version),
  );

  if (!isAllowed) {
    return c.text(
      "403 Forbidden: You do not have access to this performance",
      403,
    );
  }

  c.header("Cache-Control", "private, no-store");
  await next();
};
