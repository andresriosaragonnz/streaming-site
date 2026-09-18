import { PublicPerformancePageLayout } from "./PublicPerformancePageLayout";

export const servePublicPerformance = async (c: any) => {
  const slug = c.req.param("slug");
  const performance = c.req.param("performance");
  const graphData = await c.env.PAGE_CACHE.get("graphDataJsonString");
  const sql = `SELECT * FROM segments WHERE performance = ?`;
  const { results } = await c.env.DB.prepare(sql)
    .bind(`${slug}-${performance}`)
    .all();
  return c.html(
    "<!doctype html>\n" +
    <PublicPerformancePageLayout segments={results} graphDataJS={graphData} />,
  );
};
