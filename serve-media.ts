import { serve } from "bun";
import { join } from "path";

const TARGET_DIR = "/home/andres/acer/fragments/target";
const PORT = 8787;

serve({
  port: PORT,
  async fetch(req) {
    const url = new URL(req.url);

    // Ensure leading slashes are stripped completely
    const relPath = url.pathname.replace(/^\/+/, "");
    const filePath = join(TARGET_DIR, relPath);

    console.log(`[${req.method}] ${url.pathname} -> ${filePath}`);

    const file = Bun.file(filePath);

    if (!(await file.exists())) {
      console.error(`❌ File not found: ${filePath}`);
      return new Response("Media Object Not Found", { status: 404 });
    }

    const headers = new Headers({
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, HEAD, OPTIONS",
      "Access-Control-Allow-Headers": "*",
      "Accept-Ranges": "bytes",
    });

    if (req.method === "OPTIONS") {
      return new Response(null, { headers });
    }

    // Set MIME types explicitly
    if (filePath.endsWith(".m3u8")) {
      headers.set("Content-Type", "application/x-mpegURL");
    } else if (filePath.endsWith(".ts")) {
      headers.set("Content-Type", "video/MP2T");
    } else if (filePath.endsWith(".mp3")) {
      headers.set("Content-Type", "audio/mpeg");
    } else if (filePath.endsWith(".mp4")) {
      headers.set("Content-Type", "video/mp4");
    }

    // Handle Range Requests for seek bar scrubbing
    const rangeHeader = req.headers.get("range");
    const fileSize = file.size;

    if (rangeHeader) {
      const parts = rangeHeader.replace(/bytes=/, "").split("-");
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
      const chunkSize = end - start + 1;

      // Slice file buffer for partial content
      const slicedFile = file.slice(start, end + 1);

      headers.set("Content-Range", `bytes ${start}-${end}/${fileSize}`);
      headers.set("Content-Length", chunkSize.toString());

      return new Response(slicedFile, {
        status: 206, // 206 Partial Content
        headers,
      });
    }

    // Default full file response
    headers.set("Content-Length", fileSize.toString());
    return new Response(file, { status: 200, headers });
  },
});

console.log(`Local media server running at http://localhost:${PORT}`);
