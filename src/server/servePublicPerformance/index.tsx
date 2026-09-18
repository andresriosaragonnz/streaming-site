import { PublicPerformancePageLayout } from "./PublicPerformancePageLayout";

export const servePublicPerformance = async (c: any) => {
  const slug = c.req.param("slug");
  const performance = c.req.param("performance");

  // 1. Fetch D1 segment data & KV graph data in parallel
  const performanceKey = `${slug}-${performance}`;
  const [graphData, { results }] = await Promise.all([
    c.env.PAGE_CACHE.get("graphDataJsonString"),
    c.env.DB.prepare(`SELECT * FROM segments WHERE performance = ?`)
      .bind(performanceKey)
      .all(),
  ]);

  // 2. Derive a lightweight cache validator (ETag) from results
  const segmentCount = results?.length || 0;
  const lastUpdated = results?.[0]?.updated_at || results?.[0]?.id || "";
  const etag = `W/"perf-${slug}-${performance}-${segmentCount}-${lastUpdated}"`;

  // Handle client conditional requests (If-None-Match)
  if (c.req.header("If-None-Match") === etag) {
    return c.text("", 304);
  }

  // 3. Set Edge CDN & Browser Cache Headers
  c.header(
    "Cache-Control",
    "public, max-age=3600, s-maxage=604800, stale-while-revalidate=86400",
  );
  c.header("ETag", etag);

  // 4. Render HTML
  return c.html(
    "<!doctype html>\n" +
    <PublicPerformancePageLayout segments={results} graphDataJS={graphData} />,
  );
};
