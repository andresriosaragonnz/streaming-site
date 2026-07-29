// serve.js
const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");
const artistData = require("./src/build/compiler/artistData");
const {
  compilePublicPerformance,
} = require("./src/build/compiler/public/compilePublicPerformance.ts");

// Import your custom template compilers
const { loadComponent } = require("./src/utils/component.ts");
const {
  formatSegments,
} = require("./src/build/compiler/utils/formatSegment.ts");

const PORT = 8080;
const PUBLIC = "./public";

http
  .createServer((req, res) => {
    const parsedUrl = new URL(req.url, `http://${req.headers.host}`);
    let urlPath = parsedUrl.pathname;

    // --- DYNAMIC SSR PAGE ROUTE (PHP Style) ---
    if (urlPath === "/playlist" || urlPath === "/private") {
      const sharedData = parsedUrl.searchParams.get("share"); // e.g., "x7K9pW2mQ,Kj8mR3wPy"
      let base64 = sharedData.replace(/-/g, "+").replace(/_/g, "/");
      while (base64.length % 4) base64 += "=";
      const decodedIds = atob(base64).split(",");

      let segments = [];

      if (decodedIds) {
        segments = decodedIds
          .map((id) => artistData.data.find((seg) => seg.id === id))
          .filter(Boolean);
      } else {
        // Fallback or default list if no share query param provided
        segments = artistData.data;
      }

      // 1. Render all card HTML strings on the server loop

      // 2. Inject pre-rendered cards HTML into the sidebar layout
      const fullPageHtml = compilePublicPerformance(
        formatSegments(segments),
        "playlist",
      );

      // 3. Return fully-rendered HTML straight to the browser
      res.writeHead(200, { "Content-Type": "text/html" });
      return res.end(fullPageHtml);
    }
    // ------------------------------------------

    // Static Asset Server (CSS, JS, Images)
    if (!path.extname(urlPath)) {
      urlPath = path.join(urlPath, "index.html");
    }

    const filePath = path.join(PUBLIC, urlPath);

    fs.readFile(filePath, (err, data) => {
      if (err) {
        res.writeHead(404, { "Content-Type": "text/plain" });
        res.end("404 Not Found");
      } else {
        const ext = path.extname(filePath);
        const contentType =
          ext === ".css"
            ? "text/css"
            : ext === ".js"
              ? "text/javascript"
              : "text/html";

        res.writeHead(200, { "Content-Type": contentType });
        res.end(data);
      }
    });
  })
  .listen(PORT, () => console.log(`Serving at http://localhost:${PORT}`));
