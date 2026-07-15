// serve.js (Updated for Clean URLs & Query Parameters)
const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");

const PORT = 8080;
const PUBLIC = "./public";

http
  .createServer((req, res) => {
    // 1. Separate the clean pathname from the ?share= query parameters
    const parsedUrl = new URL(req.url, `http://${req.headers.host}`);
    let urlPath = parsedUrl.pathname;

    // 2. If the pathname doesn't have an extension, target its index.html
    if (!path.extname(urlPath)) {
      urlPath = path.join(urlPath, "index.html");
    }

    const filePath = path.join(PUBLIC, urlPath);

    fs.readFile(filePath, (err, data) => {
      console.log(err);
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
