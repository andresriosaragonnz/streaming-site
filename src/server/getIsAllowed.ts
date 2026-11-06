import { getAuthPayload, hasArtistAccess } from "./auth";

export const getIsAllowed = async (artistId: string, c: any) => {
  const currentArtist = await c.env.DB.prepare(
    `SELECT id, token_version FROM artists WHERE id = ?`,
  )
    .bind(artistId)
    .first();

  if (!currentArtist) return false;

  const payload = await getAuthPayload(c);
  return hasArtistAccess(
    payload,
    currentArtist.id,
    currentArtist.token_version,
  );
};
