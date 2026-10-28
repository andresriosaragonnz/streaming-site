import { verifyAuthToken } from "./crypto";
import { parseCookies } from "./parseCookie";
import type { UserPayload } from "./types";
import { hashNameToId } from "../utils/makeId";

export const usePublic = async (c: any, next: any) => {
  const cookies = parseCookies(c.req.header("Cookie"));
  const token = cookies["auth_token"];
  if (!token) {
    await next();
  }
  const payload = await verifyAuthToken<UserPayload>(token, c.env.AUTH_SECRET);
  if (!payload) {
    return c.text("403 Forbidden: Invalid token", 403);
  }

  // Check Expiration if defined
  if (payload.exp && Date.now() / 1000 > payload.exp) {
    return c.text("403 Forbidden: Token expired", 403);
  }

  const requestedArtist = c.req.param("slug");
  const artistId = hashNameToId(requestedArtist);
  const sql = `SELECT * FROM artists WHERE id = ?`;
  const { id, token_version } = await c.env.DB.prepare(sql)
    .bind(artistId)
    .first();
  const withVersion = `${id}_${token_version}`;

  // Check if requested group is in user's privilege list
  if (!payload.allowed.includes(withVersion)) {
    return c.text(
      `403 Forbidden: You do not have access to ${requestedArtist}`,
      403,
    );
  }
  await next();
};
