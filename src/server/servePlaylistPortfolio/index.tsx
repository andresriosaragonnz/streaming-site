import { PlaylistPortfolioLayout } from "./PlaylistPortfolioLayout";

export const servePlaylistPortfolio = async (c: any) => {
  return c.html("<!doctype html>\n" + <PlaylistPortfolioLayout />);
};
