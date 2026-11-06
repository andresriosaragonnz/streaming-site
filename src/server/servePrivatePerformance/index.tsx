import { PrivatePerformancePageLayout } from "./PrivatePerformancePageLayout";
import { formatSegments } from "../../formatSegments/index";
import { getVideographers } from "../getVideographers";

export const servePrivatePerformance = async (c: any) => {
  const slug = c.req.param("slug");
  const sql = `SELECT * FROM segments WHERE performance = ?`;
  const { results } = await c.env.DB.prepare(sql).bind(slug).all();
  const videographers = await getVideographers(c);
  const { formattedSegments } = formatSegments(results, videographers);
  return c.html(
    "<!doctype html>\n" +
    <PrivatePerformancePageLayout formattedSegments={formattedSegments} />,
  );
};
