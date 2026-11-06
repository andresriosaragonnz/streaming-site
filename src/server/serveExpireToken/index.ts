import { hashNameToId } from "../../utils/makeId";
import { isAdminRequest } from "../auth";
import { parseGroupParam } from "../parseGroup";

export const serveExpireToken = async (c: any) => {
  if (!isAdminRequest(c)) {
    return c.text("Unauthorized", 401);
  }

  const parsedGroup = parseGroupParam(c.req.query("group"));
  if (!parsedGroup.ok) {
    return c.text(parsedGroup.message, 400);
  }

  const id = hashNameToId(parsedGroup.value);
  await c.env.DB.prepare(
    `UPDATE artists SET token_version = token_version + 1 WHERE id = ?`,
  )
    .bind(id)
    .run();

  c.header("Cache-Control", "no-store");
  return c.json({ sucess: true });
};
