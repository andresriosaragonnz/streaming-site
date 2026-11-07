import { Hono } from "hono";
import {
  servePrivatePerformance,
  servePrivateDashboard,
  servePlaylist,
  commitStatus,
  usePrivate,
  usePrivatePerformance,
  useAdmin,
  serveGenerateToken,
  serveClaim,
  serveOptions,
  servePlaylistPortfolio,
  servePlaylistPortfolioCards,
  serveDisable,
  serveEnable,
  servePublicPortfolio,
  serveExpireToken,
  servePublicPerformance,
  serveStatus,
  serveDownload,
  serveTech,
  serveAudit,
  usePublicPortfolio,
  usePublicPerformance,
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
app.get("/status", serveStatus);
app.get("/myplaylists", servePlaylistPortfolio);
app.get("/playlist", servePlaylist);
app.get("/auth/claim", serveClaim);

// ---------------------------------------------------------
// 3. Admin & Destructive Routes (protected by header key)
// ---------------------------------------------------------
app.use("/admin/*", useAdmin);
app.use("/disable", useAdmin);
app.use("/enable", useAdmin);
app.use("/expiretoken", useAdmin);

app.post("/disable", serveDisable);
app.get("/enable", serveEnable);
app.get("/expiretoken", serveExpireToken);
app.get("/admin/generate-token", serveGenerateToken);
app.get("/admin/audit", serveAudit);

// ---------------------------------------------------------
// 4. Public / Artist APIs
// ---------------------------------------------------------
app.post("/api/commit-status", commitStatus);
app.get("/api/playlists/portfolio-components", servePlaylistPortfolioCards);
app.get("/api/search-options", serveOptions);

// ---------------------------------------------------------
// 5. Private Auth Middlewares (must precede the routes they protect)
// ---------------------------------------------------------
app.use("/private/performance/:slug", usePrivatePerformance);
app.use("/private/:slug", usePrivate);

app.get("/private/performance/:slug", servePrivatePerformance);
app.get("/private/:slug", servePrivateDashboard);

// ---------------------------------------------------------
// 6. Specific Parametric Private Routes
// ---------------------------------------------------------
app.get("/download/:slug", serveDownload);
app.get("/tech", serveTech);

// Explicit extension guard for missing static assets
app.get("/:file{.+\\.(?:png|ico|jpg|jpeg|svg|css|js)$}", (c) =>
  c.text("Asset Not Found", 404),
);
// ---------------------------------------------------------
// 7. Catch-All Parametric Route (MUST BE ABSOLUTE LAST)
// ---------------------------------------------------------
app.use("/:slug", usePublicPortfolio);
app.use("/:slug/:performance", usePublicPerformance);

app.get("/:slug/:performance", servePublicPerformance);
app.get("/:slug", servePublicPortfolio);

export default app;
