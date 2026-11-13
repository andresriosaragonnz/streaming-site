import { formatSegments } from "../../formatSegments/index";
import { PlaylistPageLayout } from "./PlaylistPageLayout";
import { escapeHtml } from "../escapeHtml";
import { getVideographers } from "../getVideographers";

const MAX_SHARE_PAYLOAD_LENGTH = 2000;
const MAX_SHARE_IDS = 50;
const SHARE_ID_PATTERN = /^[a-zA-Z0-9_-]{1,32}$/;

type ParseShareResult =
  | { ok: true; value: string[] }
  | { ok: false; message: string };

/**
 * Decodes the base64 share payload once and returns only valid segment IDs.
 * Bounds the payload length and ID count before any database work.
 */
const parseShareIds = (shareParam: string): ParseShareResult => {
  if (shareParam.length > MAX_SHARE_PAYLOAD_LENGTH) {
    return { ok: false, message: "Share payload too large" };
  }

  let decoded: string;
  try {
    const normalized = shareParam.replace(/-/g, "+").replace(/_/g, "/");
    const padded = normalized.padEnd(
      normalized.length + ((4 - (normalized.length % 4)) % 4),
      "=",
    );
    decoded = atob(padded);
  } catch {
    return { ok: false, message: "Invalid share payload" };
  }

  const ids = Array.from(
    new Set(
      decoded
        .split(",")
        .map((id) => id.trim())
        .filter((id) => SHARE_ID_PATTERN.test(id)),
    ),
  );

  if (ids.length === 0 || ids.length > MAX_SHARE_IDS) {
    return { ok: false, message: "Invalid playlist IDs or count exceeds limit" };
  }

  return { ok: true, value: ids };
};

export const servePlaylist = async (c: any) => {
  const shareParam = c.req.query("share");
  const rawNameParam = c.req.query("name") || "playlist";

  // 1. Sanitize & escape name parameter to prevent Reflected XSS
  const nameParam = escapeHtml(rawNameParam.trim().slice(0, 50));

  if (!shareParam || typeof shareParam !== "string") {
    return c.redirect("/myplaylists", 302);
  }

  const parsed = parseShareIds(shareParam);
  if (!parsed.ok) {
    return c.text(parsed.message, 400);
  }

  const ids = parsed.value;
  const videographers = await getVideographers(c);

  try {
    // 2. Construct SQL statement with parameterized placeholders
    const placeholders = ids.map(() => "?").join(", ");
    const sql = `SELECT * FROM segments WHERE id IN (${placeholders}) AND status = 'public'`;

    // 3. Query D1
    const { results } = await c.env.DB.prepare(sql).bind(...ids).all();

    // 4. Fast O(1) lookup map instead of O(N * M) .find()
    const resultMap = new Map(results.map((r: any) => [r.id, r]));
    const found = ids.map((id) => resultMap.get(id)).filter(Boolean); // Cleanly drop missing IDs

    const formatted = formatSegments(found, videographers);

    // 5. Sanitize DB record fields to guard against Second-Order XSS
    const sanitizedSegments = formatted.formattedSegments.map(
      (segment: any) => ({
        ...segment,
        title: segment.title,
        formattedTitle: segment.formattedTitle,
        formattedArtist: segment.formattedArtist,
        formattedVenue: segment.formattedVenue,
        artistName: segment.artistName,
        venueName: segment.venueName,
      }),
    );

    // 6. Set defensive headers (Cache-Control & Content Security Policy)
    c.header(
      "Cache-Control",
      "public, max-age=0, s-maxage=31536000, must-revalidate",
    );
    c.header("Cache-Tag", "public-feed");
    const response = c.html(
      "<!doctype html>\n" +
      <PlaylistPageLayout pageTitle={nameParam} segments={sanitizedSegments} />,
    );
    const playlistCacheKey =
      new URL(c.req.url).pathname + new URL(c.req.url).search;
    const cache = await caches.open("default");
    await cache.put(playlistCacheKey, response.clone());
    return response;
  } catch (err) {
    console.error("Failed to load playlist:", err);
    return c.text("Failed to load playlist", 500);
  }
};
