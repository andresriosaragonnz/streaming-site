import { PublicPortfolioLayout } from "./PublicPortfolioLayout";

export const servePublicPortfolio = async (c: any) => {
  const slug = c.req.param("slug");
  const graphData = await c.env.PAGE_CACHE.get("graphDataJsonString");
  const sql = `SELECT * FROM segments WHERE artistName = ?`;
  const { results } = await c.env.DB.prepare(sql).bind(slug).all();
  return c.html(
    "<!doctype html>\n" +
    <PublicPortfolioLayout segments={results} graphDataJS={graphData} />,
  );
};
