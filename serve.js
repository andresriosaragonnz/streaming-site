// serve.js (Updated for Clean URLs)
const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");

const PORT = 8080;
const PUBLIC = "./public";

http
  .createServer((req, res) => {
    let urlPath = req.url;

    // If the path doesn't have a file extension (like .html, .css, .js),
    // assume it's a directory route and look for its index.html
    if (!path.extname(urlPath)) {
      urlPath = path.join(urlPath, "index.html");
    }

    const filePath = path.join(PUBLIC, urlPath);

    fs.readFile(filePath, (err, data) => {
      if (err) {
        res.writeHead(404, { "Content-Type": "text/plain" });
        res.end("404 Not Found");
      } else {
        // Basic content-type helper
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
