import { getAuthPayload, hasArtistAccess, isAdminRequest } from "./auth";

/**
 * Guards the public performance route (`/:slug/:performance`).
 *
 * A performance has a single artist, so a single artist check is enough.
 * Admins (valid `X-Mobile-Admin-Key`) bypass artist scoping entirely.
 * Artists may view their own performance; everyone else is blocked.
 */
export const usePublicPerformance = async (c: any, next: any) => {
  const isAdmin = isAdminRequest(c);
  const payload = await getAuthPayload(c);
  let isAllowed = false;

  if (!isAdmin) {
    const segments = c.req.path.split("/").filter(Boolean);
    const performance = `${segments[0]}-${segments[1]}`;
    const { results } = await c.env.DB.prepare(
      `SELECT DISTINCT s.artistId, a.id, a.token_version
       FROM segments s
       LEFT JOIN artists a ON a.id = s.artistId
       WHERE s.performance = ?`,
    )
      .bind(performance)
      .all();

    // A performance has a single artist, so a single artist check is enough.
    const artist = (results || [])[0];
    isAllowed =
      artist !== undefined &&
      artist.id !== null &&
      hasArtistAccess(payload, artist.id, artist.token_version);
  }

  if (!isAdmin && !isAllowed) {
    return c.text("Unauthorized device", 401);
  }

  await next();
};
