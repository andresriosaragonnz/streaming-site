import { renderPrivatePerformance } from "../compiler/private/renderPrivatePerformance/renderPrivatePerformance";

export const servePrivatePerformance = async (c: any) => {
  const slug = c.req.param("slug");
  const sql = `SELECT * FROM segments WHERE performance = ?`;
  const { results } = await c.env.DB.prepare(sql).bind(slug).all();
  const html = renderPrivatePerformance(results);
  return c.html(html);
};
