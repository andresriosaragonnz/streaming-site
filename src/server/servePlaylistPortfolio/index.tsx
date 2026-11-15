import { PlaylistPortfolioLayout } from "./PlaylistPortfolioLayout";

export const servePlaylistPortfolio = async (c: any) => {
  c.header(
    "Cache-Control",
    "public, max-age=0, s-maxage=3600, must-revalidate",
  );
  c.header("Cache-Tag", "public-feed");
  return c.html("<!doctype html>\n" + <PlaylistPortfolioLayout />);
};
