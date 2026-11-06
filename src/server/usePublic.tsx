import { getAuthPayload, hasArtistAccess } from "./auth";
import { hashNameToId } from "../utils/makeId";

/**
 * Optional public-page middleware. Kept for callers that want to surface
 * owner-only controls without blocking anonymous visitors.
 */
export const usePublic = async (c: any, next: any) => {
  const payload = await getAuthPayload(c);
  if (!payload) {
    await next();
    return;
  }

  const requestedArtist = c.req.param("slug");
  if (!requestedArtist) {
    await next();
    return;
  }

  const artistId = hashNameToId(requestedArtist);
  const artist = await c.env.DB.prepare(
    `SELECT id, token_version FROM artists WHERE id = ?`,
  )
    .bind(artistId)
    .first();

  if (!artist || !hasArtistAccess(payload, artist.id, artist.token_version)) {
    return c.text(
      `403 Forbidden: You do not have access to ${requestedArtist}`,
      403,
    );
  }

  await next();
};
