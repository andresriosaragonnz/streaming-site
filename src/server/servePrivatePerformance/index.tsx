import { PrivatePerformancePageLayout } from "./PrivatePerformancePageLayout";

export const servePrivatePerformance = async (c: any) => {
  const slug = c.req.param("slug");
  const sql = `SELECT * FROM segments WHERE performance = ?`;
  const { results } = await c.env.DB.prepare(sql).bind(slug).all();
  return c.html(
    "<!doctype html>\n" + <PrivatePerformancePageLayout segments={results} />,
  );
};
