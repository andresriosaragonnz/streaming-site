import { serve } from "bun";
import { join } from "path";

const TARGET_DIR = "/home/andres/acer/fragments/target";
const PORT = 8787;

serve({
  port: PORT,
  async fetch(req) {
    const url = new URL(req.url);

    // Ensure leading slashes are stripped completely so join doesn't treat it as absolute
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
    });

    if (req.method === "OPTIONS") {
      return new Response(null, { headers });
    }

    if (filePath.endsWith(".m3u8")) {
      headers.set("Content-Type", "application/x-mpegURL");
    } else if (filePath.endsWith(".ts")) {
      headers.set("Content-Type", "video/MP2T");
    }

    return new Response(file, { headers });
  },
});

console.log(`Local media server running at http://localhost:${PORT}`);
