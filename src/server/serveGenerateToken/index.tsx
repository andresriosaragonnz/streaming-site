import { createAuthToken } from "../crypto";
import { isAdminRequest } from "../auth";
import { parseGroupParam } from "../parseGroup";
import type { UserPayload } from "../types";
import { hashNameToId } from "../../utils/makeId";

export const serveGenerateToken = async (c: any) => {
  if (!isAdminRequest(c)) {
    return c.text("Unauthorized", 401);
  }

  const parsedGroup = parseGroupParam(c.req.query("group"));
  if (!parsedGroup.ok) {
    return c.text(parsedGroup.message, 400);
  }

  const id = hashNameToId(parsedGroup.value);
  const artist = await c.env.DB.prepare(
    `SELECT id, token_version FROM artists WHERE id = ?`,
  )
    .bind(id)
    .first();

  if (!artist) {
    return c.text("Unknown artist", 404);
  }

  const payload: UserPayload = {
    allowed: [`${artist.id}_${artist.token_version}`],
  };

  const token = await createAuthToken(payload, c.env.AUTH_SECRET);
  const claimUrl = `${new URL(c.req.url).origin}/auth/claim?token=${token}`;

  c.header("Cache-Control", "no-store");
  return c.json({ claimUrl });
};
