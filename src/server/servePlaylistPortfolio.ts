import { renderPlaylistPortfolio } from "../compiler/playlist/playlistList/renderPlaylistPortfolio";

export const servePlaylistPortfolio = async (c: any) => {
  const segParam = c.req.query("seg");
  const nameParam = c.req.query("names");
  const lParam = c.req.query("l");
  if (!segParam) {
    const html = renderPlaylistPortfolio([], [], ["0"]);
    return c.html(html);
  }
  try {
    // 3. Decode base64 to plain text ID string (e.g., "id1,id2,id3")
    const decodedString = atob(segParam);
    const ids = decodedString.split(",").filter(Boolean);
    const nameString = atob(nameParam);
    const names = nameString.split(",").filter(Boolean);
    const lString = atob(lParam);
    const ls = lString.split(",").filter(Boolean);
    if (ids.length === 0) {
      return c.text("Invalid playlist IDs", 400);
    }

    // 6. Render and return HTML page
    const html = renderPlaylistPortfolio(ids, names, ls);
    return c.html(html);
  } catch (err) {
    console.error("Failed to parse playlist share parameter:", err);
    return c.text("Invalid share payload", 400);
  }
};
