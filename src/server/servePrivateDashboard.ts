import { renderPrivateDashboard } from "../compiler/private/renderPrivateDashboard/renderPrivateDashboard";
import { hashNameToId } from "../utils/makeId";

export const servePrivateDashboard = async (c: any) => {
  const slug = c.req.param("slug");
  const id = hashNameToId(slug);

  const sql = `SELECT * FROM segments WHERE artistId = ?`;

  const { results } = await c.env.DB.prepare(sql).bind(id).all();

  const html = renderPrivateDashboard(results);
  return c.html(html);
};
