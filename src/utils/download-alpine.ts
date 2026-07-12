import fs from "fs";
import path from "path";

// Define where the local JS directory lives in your public folder
const JS_DIR = path.join(import.meta.dir, "../public/js");
const TARGET_PATH = path.join(JS_DIR, "alpine.js");

// Official unpkg CDN source link for the modern Alpine.js core bundle
const ALPINE_CDN_URL = "https://unpkg.com/alpinejs@3.x.x/dist/cdn.min.js";

async function downloadAlpine() {
  console.log("🌐 Fetching latest Alpine.js core bundle...");

  if (!fs.existsSync(JS_DIR)) {
    fs.mkdirSync(JS_DIR, { recursive: true });
  }

  try {
    const response = await fetch(ALPINE_CDN_URL);

    if (!response.ok) {
      throw new Error(`Failed to fetch file: ${response.statusText}`);
    }

    const fileBuffer = await response.arrayBuffer();
    fs.writeFileSync(TARGET_PATH, Buffer.from(fileBuffer));

    console.log(`✨ Alpine.js successfully saved locally to: ${TARGET_PATH}`);
  } catch (error) {
    console.error("❌ Error downloading Alpine.js:", error);
    process.exit(1);
  }
}

downloadAlpine();
