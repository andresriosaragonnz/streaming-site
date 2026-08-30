import { hashNameToId } from "../../utils/makeId";
import { PrivateDashboardLayout } from "./PrivateDashboardLayout";

export const servePrivateDashboard = async (c: any) => {
  const slug = c.req.param("slug");
  const id = hashNameToId(slug);

  const sql = `SELECT * FROM segments WHERE artistId = ?`;

  const { results } = await c.env.DB.prepare(sql).bind(id).all();

  return c.html(
    "<!doctype html>\n" + <PrivateDashboardLayout segments={results} />,
  );
};
