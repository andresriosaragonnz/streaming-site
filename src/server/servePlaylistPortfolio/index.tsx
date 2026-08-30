import { PlaylistPortfolioLayout } from "./PlaylistPortfolioLayout";

export const servePlaylistPortfolio = async (c: any) => {
  const segParam = c.req.query("seg");
  const nameParam = c.req.query("names");
  const lParam = c.req.query("l");

  if (!segParam) {
    return c.html(
      "<!doctype html>\n" +
      <PlaylistPortfolioLayout ids={[]} names={[]} ls={[]} />,
    );
  }

  try {
    // Decode parameters
    const decodedString = atob(segParam);
    const ids = decodedString.split(",").filter(Boolean);
    const nameString = atob(nameParam || "");
    const names = nameString.split(",").filter(Boolean);
    const lString = atob(lParam || "");
    const ls = lString.split(",").filter(Boolean);

    if (ids.length === 0) {
      return c.text("Invalid playlist IDs", 400);
    }

    // Zip arrays into structured PlaylistDataItem objects
    const playlists = ids.map((id, index) => ({
      playlistName: names[index] || id,
      playlistLength: ls[index] || "0",
      altImage: id,
      cardImage: id,
    }));

    const heroImage = playlists[0]?.cardImage || "";
    return c.html(
      "<!doctype html>\n" +
      <PlaylistPortfolioLayout ids={ids} names={names} ls={ls} />,
    );
  } catch (err) {
    console.error("Failed to parse playlist share parameter:", err);
    return c.text("Invalid share payload", 400);
  }
};
