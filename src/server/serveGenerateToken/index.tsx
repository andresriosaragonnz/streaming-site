import { createAuthToken } from "../crypto";
import type { UserPayload } from "../types";
import { hashNameToId } from "../../utils/makeId";

export const serveGenerateToken = async (c: any) => {
  const mobileKey =
    c.req.header("X-Mobile-Admin-Key") || c.req.query("admin_key");
  if (!mobileKey || mobileKey !== c.env.MOBILE_ADMIN_SECRET) {
    return c.text("Unauthorized device", 401);
  }

  const group = c.req.query("group");

  if (!group) return c.text("Missing params", 400);
  const id = hashNameToId(group);
  const sql = `SELECT * FROM artists WHERE id = ?`;
  const result = await c.env.DB.prepare(sql).bind(id).first();
  const payload: UserPayload = {
    allowed: id,
    v: result.token_version,
    // exp: Math.floor(Date.now() / 1000) + (60 * 60 * 24 * 365)
  };
  const token = await createAuthToken(payload, c.env.AUTH_SECRET);
  const claimUrl = `${new URL(c.req.url).origin}/auth/claim?token=${token}`;
  return c.json({
    claimUrl: claimUrl,
  });
};
