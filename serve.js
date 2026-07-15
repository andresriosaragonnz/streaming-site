// serve.js (Updated with Filter Endpoint)
const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");

const PORT = 8080;
const PUBLIC = "./public";

// The master database array held in memory on the server
const MASTER_SEGMENTS = [
  {
    id: "x7K9pW2mQ",
    title: "segment_0",
    index: "0",
    startTime: 0,
    duration: 360,
    hash: "sha256-8f43c08b2bc96173d1222f2812d4d97f268b8a0a1a0f8821017b203c90aefd6f",
    performance: "decibel_force-ding_dong_lounge-20241012",
    source:
      "https://pub-fef6bcaae286450e98785a845f724ff1.r2.dev/Decibel%20Force%20-%20Eclipse%20-Live%20ant%20Ding%20dong%2012%20oct%202024/output.m3u8",
    status: "public",
  },
  {
    id: "bN4vL9zTx",
    title: "segment_1",
    index: "1",
    startTime: 360,
    duration: 360,
    hash: "sha256-2db5c98a5fc8b56f26487e83ac5bde92c10b2bcfc4d4f647bc5d290fa8cb3fe1",
    performance: "decibel_force-ding_dong_lounge-20241012",
    source:
      "https://pub-fef6bcaae286450e98785a845f724ff1.r2.dev/Decibel%20Force%20-%20Edge%20of%20the%20World%20%20-Live%20ant%20Ding%20dong%2012%20oct%202024/output.m3u8",
    status: "public",
  },
  {
    id: "Kj8mR3wPy",
    title: "segment_2",
    index: "2",
    startTime: 720,
    duration: 360,
    hash: "sha256-fd304e8d2bb56fa2b88fce71cf7d853b0dfae63b8d4f45a75cfdd17fa4bb529e",
    performance: "decibel_force-ding_dong_lounge-20241012",
    source:
      "https://pub-fef6bcaae286450e98785a845f724ff1.r2.dev/Decibel%20Force%20-%20Endles%20Thread%20%20%20-Live%20at%20Ding%20dong%2012%20oct%202024/output.m3u8",
    status: "public",
  },
];

http
  .createServer((req, res) => {
    const parsedUrl = new URL(req.url, `http://${req.headers.host}`);
    let urlPath = parsedUrl.pathname;

    // --- NEW DYNAMIC ENDPOINT ---
    if (urlPath === "/api/segments") {
      const idsParam = parsedUrl.searchParams.get("ids"); // e.g., "x7K9pW2mQ,Kj8mR3wPy"

      if (!idsParam) {
        res.writeHead(200, { "Content-Type": "application/json" });
        return res.end(JSON.stringify([]));
      }

      const requestedIds = idsParam.split(",");
      // Filter the static array matching only items present in the request parameters
      const filteredSegments = requestedIds
        .map((id) => MASTER_SEGMENTS.find((seg) => seg.id === id))
        .filter((seg) => seg !== undefined);

      res.writeHead(200, { "Content-Type": "application/json" });
      return res.end(JSON.stringify(filteredSegments));
    }
    // ----------------------------

    // If the path doesn't have an extension, target its index.html
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
