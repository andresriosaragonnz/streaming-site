import { createAuthToken } from "./crypto";
import type { UserPayload } from "./types";

export const serveGenerateToken = async (c: any) => {
  console.log("dakjdsakjdhsa");
  const mobileKey =
    c.req.header("X-Mobile-Admin-Key") || c.req.query("admin_key");
  console.log({ mobileKey, ex: c.env.MOBILE_ADMIN_SECRET });
  if (!mobileKey || mobileKey !== c.env.MOBILE_ADMIN_SECRET) {
    return c.text("Unauthorized device", 401);
  }

  const groups = c.req.query("groups")?.split(","); // ['queen', 'freddie-mercury']

  if (!groups) return c.text("Missing params", 400);

  const payload: UserPayload = {
    allowed: groups,
    // exp: Math.floor(Date.now() / 1000) + (60 * 60 * 24 * 365) // Optional 1-year expiration
  };
  const token = await createAuthToken(payload, c.env.AUTH_SECRET);
  const claimUrl = `${new URL(c.req.url).origin}/auth/claim?token=${token}`;
  return c.json({
    claimUrl: claimUrl,
  });
};
