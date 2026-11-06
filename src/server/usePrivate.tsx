import { getAuthPayload, hasArtistAccess } from "./auth";
import { hashNameToId } from "../utils/makeId";
import { UnauthorizedPageLayout } from "./serveUnauthorized";

export const usePrivate = async (c: any, next: any) => {
  const payload = await getAuthPayload(c);
  if (!payload) {
    return c.html("<!doctype html>\n" + <UnauthorizedPageLayout />, 401);
  }

  const requestedArtist = c.req.param("slug");
  if (!requestedArtist) {
    return c.text("Bad Request", 400);
  }

  const artistId = hashNameToId(requestedArtist);
  const artist = await c.env.DB.prepare(
    `SELECT id, token_version FROM artists WHERE id = ?`,
  )
    .bind(artistId)
    .first();

  if (!artist) {
    return c.text("Artist not found", 404);
  }

  if (!hasArtistAccess(payload, artist.id, artist.token_version)) {
    return c.text(
      `403 Forbidden: You do not have access to ${requestedArtist}`,
      403,
    );
  }

  c.header("Cache-Control", "private, no-store");
  await next();
};
