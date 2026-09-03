import { getCardImage } from "../../compiler/formatSegments/getCardImage";
import { getHeroImage } from "../../compiler/formatSegments/getHeroImage";
import { FeedLayout } from "./FeedLayout";

// Helper to escape HTML characters to prevent XSS
function escapeHtml(str: string): string {
  if (typeof str !== "string") return "";
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

const countByArtist = (segments: any[]) => {
  const artists: Record<string, any> = {};
  for (const segment of segments) {
    if (artists[segment.artistId]) {
      artists[segment.artistId].count++;
    } else {
      artists[segment.artistId] = {
        count: 1,
        image: getCardImage(segment.id),
        heroImage: getHeroImage(segment.id),
        artistName: escapeHtml(segment.artistName.replaceAll("_", " ")),
        link: escapeHtml(segment.artistName),
      };
    }
  }
  return Object.values(artists);
};

export const serveFeed = async (c: any) => {
  console.log("here");
  try {
    let shareParam = c.req.query("art");
    console.log({ shareParam });

    if (!shareParam || typeof shareParam !== "string") {
      return c.html("<!doctype html>\n" + <FeedLayout />);
    }

    // 2. Bound total length of base64 payload to prevent DoS
    if (shareParam.length > 2000) {
      return c.text("Share payload too large", 400);
    }

    // Standardize URL-safe Base64
    shareParam = shareParam.replace(/-/g, "+").replace(/_/g, "/");
    while (shareParam.length % 4) {
      shareParam += "=";
    }

    // 3. Decode Base64 and validate artist IDs strictly (alphanumeric, dashes, underscores)
    const decodedString = atob(shareParam);
    const artistIds = decodedString
      .split(",")
      .map((id) => id.trim())
      .filter((id) => /^[a-zA-Z0-9_-]{1,32}$/.test(id));

    // Limit maximum allowed IDs per query to prevent D1 parameter overflow
    if (artistIds.length === 0 || artistIds.length > 50) {
      return c.text("Invalid playlist IDs or count exceeds limit", 400);
    }

    const now = Math.floor(Date.now() / 1000);
    const THIRTY_DAYS_SEC = 2592000;

    // 4. Construct SQL statement with placeholders for dynamic IN clause
    const placeholders = artistIds.map(() => "?").join(", ");
    const sql = `
        SELECT * FROM segments 
        WHERE artistId IN (${placeholders})
            AND status = 'public' 
            AND published_at IS NOT NULL
            AND (? - published_at) <= ?
        ORDER BY published_at DESC
        `;

    // 5. Query D1 with bound IDs PLUS current timestamp and 30-day threshold
    const { results } = await c.env.DB.prepare(sql)
      .bind(...artistIds, now, THIRTY_DAYS_SEC)
      .all();

    // 6. Sanitize DB record fields to guard against Second-Order XSS
    const sanitizedResults = (results || []).map((segment: any) => ({
      ...segment,
      artistName: escapeHtml(segment.artistName),
      artistId: escapeHtml(segment.artistId),
    }));

    // 7. Set defensive headers
    c.header("Cache-Control", "private, no-store, max-age=0");

    return c.html(
      "<!doctype html>\n" +
      <FeedLayout updates={countByArtist(sanitizedResults)} />,
    );
  } catch (err) {
    console.error("Failed to parse playlist share parameter:", err);
    return c.text("Invalid share payload", 400);
  }
};
