import { renderPrivateDashboard } from "../compiler/private/renderPrivateDashboard/renderPrivateDashboard";

export const servePrivateDashboard = async (c: any) => {
  const slug = c.req.param("slug");
  const sql = `SELECT * FROM segments WHERE artistId = ?`;
  const { results } = await c.env.DB.prepare(sql).bind(slug).all();
  const html = renderPrivateDashboard(results);
  return c.html(html);
};
