import { parseCookies } from "./parseCookie";
import { verifyAuthToken } from "./crypto";
import type { UserPayload } from "./types";

export const getIsAllowed = async (artistId: string, c: any) => {
  const currentArtist = await c.env.DB.prepare(
    `SELECT * FROM artists WHERE id = ?`,
  )
    .bind(artistId)
    .first();
  const cookies = parseCookies(c.req.header("Cookie"));
  const token = cookies["auth_token"];
  const payload = await verifyAuthToken<UserPayload>(token, c.env.AUTH_SECRET);
  const isAllowed =
    payload?.allowed.includes(
      `${currentArtist.id}_${currentArtist.token_version}`,
    ) || false;
  return isAllowed;
};
