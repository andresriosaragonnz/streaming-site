import { Context } from "hono";
import { renderPortfolioGrid } from "./PlaylistPortfolioGrid";

export const servePlaylistPortfolioCards = async (c: Context) => {
  const segParam = c.req.query("seg") || "";
  const nameParam = c.req.query("names") || "";
  const lParam = c.req.query("l") || "";

  try {
    const ids = segParam ? atob(segParam).split(",").filter(Boolean) : [];
    const names = nameParam ? atob(nameParam).split(",").filter(Boolean) : [];
    const ls = lParam ? atob(lParam).split(",").filter(Boolean) : [];

    const { cardsHTML, heroHTML, count } = renderPortfolioGrid({
      ids,
      names,
      ls,
    });

    return c.json({
      cardsHTML,
      heroHTML,
      count,
    });
  } catch (err) {
    console.error("Failed to parse playlist portfolio parameters:", err);
    return c.json({ error: "Invalid portfolio payload" }, 400);
  }
};
