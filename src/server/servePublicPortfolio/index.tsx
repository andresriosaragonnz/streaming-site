import { PublicPortfolioLayout } from "./PublicPortfolioLayout";

export const servePublicPortfolio = async (c: any) => {
  const slug = c.req.param("slug");

  // 1. Fetch D1 segment data & KV graph data in parallel
  const [graphData, { results }] = await Promise.all([
    c.env.PAGE_CACHE.get("graphDataJsonString"),
    c.env.DB.prepare(`SELECT * FROM segments WHERE artistName = ?`)
      .bind(slug)
      .all(),
  ]);

  // 2. Derive a lightweight cache validator (ETag) from artist results
  const segmentCount = results?.length || 0;
  const lastUpdated = results?.[0]?.updated_at || results?.[0]?.id || "";
  const etag = `W/"port-${slug}-${segmentCount}-${lastUpdated}"`;

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
    <PublicPortfolioLayout segments={results} graphDataJS={graphData} />,
  );
};
