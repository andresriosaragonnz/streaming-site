import { hashNameToId } from "../../utils/makeId";
import { isAdminRequest } from "../auth";

export const serveExpireToken = async (c: any) => {
  if (!isAdminRequest(c)) {
    return c.text("Unauthorized", 401);
  }

  const group = c.req.query("group");
  if (!group || typeof group !== "string") {
    return c.text("Missing params", 400);
  }

  const id = hashNameToId(group);
  await c.env.DB.prepare(
    `UPDATE artists SET token_version = token_version + 1 WHERE id = ?`,
  )
    .bind(id)
    .run();

  c.header("Cache-Control", "no-store");
  return c.json({ sucess: true });
};
