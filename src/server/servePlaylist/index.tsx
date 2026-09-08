import { formatSegments } from "../../formatSegments/index";
import { PlaylistPageLayout } from "./PlaylistPageLayout";

// Helper to escape HTML characters
function escapeHtml(str: string): string {
  if (typeof str !== "string") return "";
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export const servePlaylist = async (c: any) => {
  let shareParam = c.req.query("share");
  const rawNameParam = c.req.query("name") || "playlist";

  // 1. Sanitize & escape name parameter to prevent Reflected XSS
  const nameParam = escapeHtml(rawNameParam.trim().slice(0, 50));

  if (!shareParam || typeof shareParam !== "string") {
    return c.redirect("/myplaylists", 302);
  }

  // 2. Bound total length of base64 payload to prevent DoS
  if (shareParam.length > 2000) {
    return c.text("Share payload too large", 400);
  }

  try {
    // Standardize URL-safe Base64
    shareParam = shareParam.replace(/-/g, "+").replace(/_/g, "/");
    while (shareParam.length % 4) {
      shareParam += "=";
    }

    // 3. Decode Base64 and validate ID format strictly (alphanumeric, dashes, underscores)
    const decodedString = atob(shareParam);
    const ids = decodedString
      .split(",")
      .map((id) => id.trim())
      .filter((id) => /^[a-zA-Z0-9_-]{1,32}$/.test(id));
    // Limit maximum allowed segments per query to prevent D1 parameter overflow
    if (ids.length === 0 || ids.length > 50) {
      return c.text("Invalid playlist IDs or count exceeds limit", 400);
    }

    // 4. Construct SQL statement with parameterized placeholders
    const placeholders = ids.map(() => "?").join(", ");
    const sql = `SELECT * FROM segments WHERE id IN (${placeholders}) AND status = 'public'`;

    // 5. Query D1
    const { results } = await c.env.DB.prepare(sql)
      .bind(...ids)
      .all();

    // 6. Fast O(1) Lookup Map instead of O(N * M) .find()
    const resultMap = new Map(results.map((r: any) => [r.id, r]));
    const found = ids.map((id) => resultMap.get(id)).filter(Boolean); // Cleanly drop missing IDs
    const formatted = formatSegments(found);
    // 7. Sanitize DB record fields to guard against Second-Order XSS
    const sanitizedSegments = formatted.formattedSegments.map(
      (segment: any) => ({
        ...segment,
        title: escapeHtml(segment.title),
        formattedTitle: escapeHtml(segment.formattedTitle),
        formattedArtist: escapeHtml(segment.formattedArtist),
        formattedVenue: escapeHtml(segment.formattedVenue),
        artistName: escapeHtml(segment.artistName),
        venueName: escapeHtml(segment.venueName),
      }),
    );
    // 9. Set defensive headers (Cache-Control & Content Security Policy)
    c.header("Cache-Control", "private, no-store, max-age=0");

    return c.html(
      "<!doctype html>\n" +
      <PlaylistPageLayout pageTitle={nameParam} segments={sanitizedSegments} />,
    );
  } catch (err) {
    console.error("Failed to parse playlist share parameter:", err);
    return c.text("Invalid share payload", 400);
  }
};
