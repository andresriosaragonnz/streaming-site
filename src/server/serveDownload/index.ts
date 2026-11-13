import {
  generateSegmentToken,
  getVideographerSigningConfig,
} from "../getVideographers";
import { getAuthPayload, hasArtistAccess } from "../auth";
import { parsePerformanceParam } from "../parsePerformance";

export const serveDownload = async (c: any) => {
  const performanceParam = c.req.param("slug");
  const payload = await getAuthPayload(c);
  if (!payload) return c.text("Unauthorized", 401);

  const parsedPerformance = parsePerformanceParam(performanceParam);
  if (!parsedPerformance.ok) {
    return c.text(parsedPerformance.message, 400);
  }
  const performance = parsedPerformance.value;

  const segment = await c.env.DB.prepare(
    `SELECT * FROM segments WHERE performance = ? LIMIT 1`,
  )
    .bind(performance)
    .first();

  if (!segment) {
    return c.text("Segment or master file not found", 404);
  }

  const artist = await c.env.DB.prepare(
    `SELECT id, token_version FROM artists WHERE id = ?`,
  )
    .bind(segment.artistId)
    .first();

  if (!artist || !hasArtistAccess(payload, artist.id, artist.token_version)) {
    return c.text("Forbidden: Unauthorized access to master video", 403);
  }

  const signing = await getVideographerSigningConfig(c, segment.videographer);
  if (!signing) {
    return c.text("Media source unavailable", 404);
  }

  // The media Worker signs `${VIDEOGRAPHER_NAME}:${expires}`, which is also
  // what generateSegmentToken produces.
  const hmacToken = await generateSegmentToken(
    signing.name,
    signing.storageKey,
    900, // 15 minutes
  );

  const objectPath = `${segment.performance}.zip`;
  const downloadUrl = `${signing.worker}/${objectPath}?token=${encodeURIComponent(
    hmacToken,
  )}&download=1`;

  c.header("Cache-Control", "private, no-store");
  return c.redirect(downloadUrl, 302);
};
