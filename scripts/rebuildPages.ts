import fs from "node:fs/promises";
import path from "node:path";
import data from "../data.json";
// Import your rendering engine
import { renderPublicEcosystem } from "../src/compiler/public/renderPublicEcosystem/renderPublicEcosystem";

async function rebuildAllPages() {
  console.log("🚀 Starting full static page rebuild...");
  const outputDir = path.resolve("dist/pages");
  const filteredSegments = data.filter(
    (segment) => (segment.status = "public"),
  );
  // Group segments by artist
  const groupedByArtist = {};
  for (const segment of filteredSegments) {
    const artist = segment.artistName;
    if (!groupedByArtist[artist]) groupedByArtist[artist] = [];
    groupedByArtist[artist].push(segment);
  }

  // Render HTML pages
  const pages = Object.values(groupedByArtist)
    .map(renderPublicEcosystem)
    .flat();
  console.log(`🔨 Rendered ${pages.length} HTML pages in memory.`);
  // Write HTML files to local dist directory
  for (const page of pages) {
    const filePath = path.join(outputDir, page.key);
    await fs.mkdir(path.dirname(filePath), { recursive: true });
    await fs.writeFile(filePath, page.value, "utf-8");
  }

  console.log(`✅ Written to ${outputDir}. Now sync to R2 using AWS CLI!`);
}

rebuildAllPages();
