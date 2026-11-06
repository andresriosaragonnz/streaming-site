import { PublicPortfolioLayout } from "./PublicPortfolioLayout";
import { PendingLayout } from "../servePending";
import { getIsAllowed } from "../getIsAllowed";
import { isAdminRequest } from "../auth";
import { getVideographers } from "../getVideographers";
import { formatSegments } from "../../formatSegments";

export const servePublicPortfolio = async (c: any) => {
  const slug = c.req.param("slug");
  const videographers = await getVideographers(c);
  // 1. Fetch D1 segment data & KV graph data in parallel
  const [graphData, { results }] = await Promise.all([
    c.env.PAGE_CACHE.get("graphDataJsonString"),
    c.env.DB.prepare(
      `SELECT * FROM segments WHERE artistName = ?  and status = "public"`,
    )
      .bind(slug)
      .all(),
  ]);
  if (!results || results.length === 0) {
    return c.html("<!doctype html>\n" + <PendingLayout />);
  }
  const artistId = results[0].artistId;
  const isAllowed = await getIsAllowed(artistId, c);
  const isAdmin = isAdminRequest(c);
  // if (!isAdmin && !isAllowed) {
  //   return c.html("<!doctype html>\n" + <PendingLayout />);
  // }
  const segmentCount = results?.length || 0;
  const lastUpdated =
    results?.reduce((max: any, item: any) => {
      const itemTime = item.updated_at
        ? new Date(item.updated_at).getTime()
        : 0;
      return itemTime > max ? itemTime : max;
    }, 0) || "";
  const etag = `W/"port-${slug}-${segmentCount}-${lastUpdated}-${isAllowed}"`;
  // Handle client conditional requests (If-None-Match)
  if (c.req.header("If-None-Match") === etag) {
    return c.body(null, 304, {
      ETag: etag,
      "Cache-Control": "public, max-age=0, must-revalidate",
    });
  }

  // 3. Set Edge CDN & Browser Cache Headers
  c.header(
    "Cache-Control",
    "public, max-age=3600, s-maxage=604800, stale-while-revalidate=86400",
  );
  c.header("ETag", etag);
  const { formattedSegments } = formatSegments(results, videographers);
  // 4. Render HTML
  return c.html(
    "<!doctype html>\n" +
    (
      <PublicPortfolioLayout
        formattedSegments={formattedSegments}
        graphDataJS={graphData}
        isAllowed={isAllowed}
      />
    ),
  );
};
