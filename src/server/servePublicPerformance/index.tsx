import { PublicPerformancePageLayout } from "./PublicPerformancePageLayout";
import { NotFound } from "./NotFound";
import { getVideographers } from "../getVideographers";
import { formatSegments } from "../../formatSegments";
import { getAuthPayload, hasArtistAccess, isAdminRequest } from "../auth";

export const servePublicPerformance = async (c: any) => {
  const slug = c.req.param("slug");
  const performance = c.req.param("performance");
  const videographers = await getVideographers(c);
  const payload = await getAuthPayload(c);

  // 1. Fetch D1 segment data & KV graph data in parallel
  const performanceKey = `${slug}-${performance}`;
  const [graphData, { results }] = await Promise.all([
    c.env.PAGE_CACHE.get("graphDataJsonString"),
    c.env.DB.prepare(
      `SELECT * FROM segments WHERE performance = ? and status = "public"`,
    )
      .bind(performanceKey)
      .all(),
  ]);
  if (!results || results.length === 0) {
    return c.html("<!doctype html>\n" + <NotFound />);
  }
  const artistId = results[0].artistId;
  const currentArtist = await c.env.DB.prepare(
    `SELECT id, token_version FROM artists WHERE id = ?`,
  )
    .bind(artistId)
    .first();
  const isAllowed = currentArtist
    ? hasArtistAccess(payload, currentArtist.id, currentArtist.token_version)
    : false;
  const adminHeader = c.req.header("X-Mobile-Admin-Key");
  const isAdmin = isAdminRequest(c);
  // if (!isAdmin && !isAllowed) {
  //   return c.text("Unauthorized device", 401);
  // }

  // 2. Derive a lightweight cache validator (ETag) from results
  const segmentCount = results?.length || 0;

  // Extract the highest updated_at timestamp from the set
  const lastUpdated =
    results?.reduce((max: any, item: any) => {
      const itemTime = item.updated_at
        ? new Date(item.updated_at).getTime()
        : 0;
      return itemTime > max ? itemTime : max;
    }, 0) || "";
  const etag = `W/"perf-${slug}-${performance}-${segmentCount}-${lastUpdated}-${isAllowed}-${isAdmin}"`;

  // Handle client conditional requests (If-None-Match)
  if (c.req.header("If-None-Match") === etag) {
    return c.body(null, 304, {
      ETag: etag,
      "Cache-Control": "public, max-age=0, must-revalidate",
    });
  }
  const { formattedSegments, totalDuration } = formatSegments(
    results,
    videographers,
  );

  // 3. Set Edge CDN & Browser Cache Headers
  c.header(
    "Cache-Control",
    "public, max-age=3600, s-maxage=604800, stale-while-revalidate=86400",
  );
  c.header("ETag", etag);
  // 4. Render HTML
  return c.html(
    "<!doctype html>\n" +
    (
      <PublicPerformancePageLayout
        formattedSegments={formattedSegments}
        graphDataJS={graphData}
        isAllowed={isAllowed}
      />
    ),
  );
};
