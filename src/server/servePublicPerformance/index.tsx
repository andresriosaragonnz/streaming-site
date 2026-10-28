import { PublicPerformancePageLayout } from "./PublicPerformancePageLayout";
import { NotFound } from "./NotFound";
import { parseCookies } from "../parseCookie";
import { verifyAuthToken } from "../crypto";
import type { UserPayload } from "../types";

export const servePublicPerformance = async (c: any) => {
  const slug = c.req.param("slug");
  const performance = c.req.param("performance");
  const cookies = parseCookies(c.req.header("Cookie"));

  const token = cookies["auth_token"];
  const payload = await verifyAuthToken<UserPayload>(token, c.env.AUTH_SECRET);

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
    `SELECT * FROM artists WHERE id = ?`,
  )
    .bind(artistId)
    .first();
  const isAllowed = payload?.allowed.includes(
    `${currentArtist.id}_${currentArtist.token_version}`,
  );
  const adminHeader = c.req.header("X-Mobile-Admin-Key");
  const isAdmin = adminHeader == c.env.MOBILE_ADMIN_SECRET;
  if (!isAdmin && !isAllowed) {
    return c.text("Unauthorized device", 401);
  }

  // 2. Derive a lightweight cache validator (ETag) from results
  const segmentCount = results?.length || 0;

  // Extract the highest updated_at timestamp from the set
  console.log(results);
  const lastUpdated =
    results?.reduce((max: any, item: any) => {
      const itemTime = item.updated_at
        ? new Date(item.updated_at).getTime()
        : 0;
      return itemTime > max ? itemTime : max;
    }, 0) || "";
  const etag = `W/"perf-${slug}-${performance}-${segmentCount}-${lastUpdated}-${isAllowed}-${isAdmin}"`;
  console.log(etag);

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
  // 4. Render HTML
  return c.html(
    "<!doctype html>\n" +
    (
      <PublicPerformancePageLayout
        segments={results}
        graphDataJS={graphData}
        isAllowed={isAllowed}
      />
    ),
  );
};
