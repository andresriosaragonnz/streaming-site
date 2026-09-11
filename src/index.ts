import { Hono } from "hono";
import {
  servePrivatePerformance,
  servePrivateDashboard,
  servePlaylist,
  commitStatus,
  serveSlug,
  usePrivate,
  serveGenerateToken,
  serveClaim,
  serveReset,
  serveOptions,
  servePlaylistPortfolio,
  servePlaylistPortfolioCards,
  serveDisable,
  serveEnable,
} from "./server";

type Bindings = {
  DB: D1Database;
};

const app = new Hono<{ Bindings: Bindings }>();

// ---------------------------------------------------------
// 1. Root Endpointa
// ---------------------------------------------------------
app.get("/", (c) => {
  return c.html("<h1>Archive Engine Server Running</h1>");
});

// ---------------------------------------------------------
// 2. Fixed API & Static Endpoints (MUST precede parametric routes)
// ---------------------------------------------------------
app.get("/myplaylists", servePlaylistPortfolio);
app.get("/playlist", servePlaylist);
app.get("/reset", serveReset);
app.get("/disable", serveDisable);
app.get("/enable", serveEnable);
app.get("/admin/generate-token", serveGenerateToken);
app.get("/auth/claim", serveClaim);

// Explicit POST routes
app.post("/api/commit-status", commitStatus);
app.get("/api/playlists/portfolio-components", servePlaylistPortfolioCards);

// API GET routes
app.get("/api/search-options", serveOptions);

// ---------------------------------------------------------
// 3. Middlewares (Must be attached BEFORE the routes they protect)
// ---------------------------------------------------------
// Replace "/private/*" with "/private/:slug/*" or "/private/:slug"
app.use("/private/performance/:slug/", usePrivate);
app.use("/private/:slug", usePrivate);

app.get("/private/:slug", servePrivateDashboard);

// ---------------------------------------------------------
// 4. Specific Parametric Private Routes
// ---------------------------------------------------------
app.get("/private/performance/:slug", servePrivatePerformance);
app.get("/private/:slug", servePrivateDashboard);

// ---------------------------------------------------------
// 5. Catch-All Parametric Route (MUST BE ABSOLUTE LAST)
// ---------------------------------------------------------
app.get("/:slug", serveSlug);

export default app;
