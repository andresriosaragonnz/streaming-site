import { renderPlaylist } from "../compiler/playlist/renderPlaylist/renderPlaylist";
import { formatSegments } from "../compiler/formatSegments/index.js";

export const servePlaylist = async (c: any) => {
  let shareParam = c.req.query("share");
  const nameParam = c.req.query("name") || "playlist";
  if (!shareParam) {
    return c.text("Missing share parameter", 400);
  }
  try {
    shareParam = shareParam.replace(/-/g, "+").replace(/_/g, "/");
    while (shareParam.length % 4) {
      shareParam += "=";
    }

    // 3. Decode base64 to plain text ID string (e.g., "id1,id2,id3")
    const decodedString = atob(shareParam);
    const ids = decodedString.split(",").filter(Boolean);
    if (ids.length === 0) {
      return c.text("Invalid playlist IDs", 400);
    }

    // 4. Construct SQL statement with placeholders for dynamic IN clause
    const placeholders = ids.map(() => "?").join(", ");
    const sql = `SELECT * FROM segments WHERE id IN (${placeholders}) AND status = 'public'`;

    // 5. Query D1 with bound IDs
    const { results } = await c.env.DB.prepare(sql)
      .bind(...ids)
      .all();
    const found = ids.map((id) =>
      results.find((result: any) => result.id === id),
    );
    // 6. Render and return HTML page
    const html = renderPlaylist(
      {
        segments: formatSegments(found),
      },
      nameParam,
    );
    return c.html(html);
  } catch (err) {
    console.error("Failed to parse playlist share parameter:", err);
    return c.text("Invalid share payload", 400);
  }
};
