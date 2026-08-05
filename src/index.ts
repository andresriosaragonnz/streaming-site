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
} from "./server";

// Define D1 Database binding type (No KV needed)
type Bindings = {
  DB: D1Database;
};

const app = new Hono<{ Bindings: Bindings }>();

app.get("/reset", serveReset);

app.get("/admin/generate-token", serveGenerateToken);

app.get("/auth/claim", serveClaim);

app.get("/private/performance/:slug", servePrivatePerformance);

app.get("/playlist", servePlaylist);

app.use("/private/:slug/*", usePrivate);
app.use("/private/:slug", usePrivate);

app.get("/private/:slug", servePrivateDashboard);

app.get("/:slug", serveSlug);

app.post("/api/commit-status", commitStatus);

app.get("/", (c) => {
  return c.html("<h1>Archive Engine Server Running</h1>");
});

export default app;
