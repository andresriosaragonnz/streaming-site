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
  serveFeed,
  servePlaylistPortfolio,
} from "./server";

type Bindings = {
  DB: D1Database;
};

const app = new Hono<{ Bindings: Bindings }>();

// 1. Explicit / Fixed API & Route handlers (Put these FIRST)
app.get("/myplaylists", servePlaylistPortfolio); // Your test route
app.get("/playlist", servePlaylist);
app.get("/reset", serveReset);
app.get("/admin/generate-token", serveGenerateToken);
app.get("/auth/claim", serveClaim);
app.get("/feed", serveFeed);

app.get("/api/search-options", serveOptions);
app.post("/api/commit-status", commitStatus);

// 2. Specific Parametric Routes
app.get("/private/performance/:slug", servePrivatePerformance);
app.get("/:slug", serveSlug);
app.get("/private/:slug", servePrivateDashboard);

// 3. Dynamic Middlewares (Must come AFTER fixed endpoints)
app.use("/private/:slug/*", usePrivate);
// 4. Fallback Root
app.get("/", (c) => {
  return c.html("<h1>Archive Engine Server Running</h1>");
});

export default app;
