import { hashNameToId } from "../../utils/makeId";

export const serveExpireToken = async (c: any) => {
  const mobileKey =
    c.req.header("X-Mobile-Admin-Key") || c.req.query("admin_key");
  if (!mobileKey || mobileKey !== c.env.MOBILE_ADMIN_SECRET) {
    return c.text("Unauthorized device", 401);
  }

  const group = c.req.query("group");

  if (!group) return c.text("Missing params", 400);
  const id = hashNameToId(group);
  const sql = `UPDATE artists SET token_version = token_version + 1 WHERE id = ?;`;
  const result = await c.env.DB.prepare(sql).bind(id).first();
  console.log({ result });
  return c.json({
    sucess: true,
  });
};
