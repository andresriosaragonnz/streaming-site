const fs = require("fs");
const path = require("path");

// Assuming your templates live here
const TEMPLATE_DIR = path.join(__dirname, "templates");
const PUBLIC_DIR = path.join(__dirname, "../public"); // Adjust based on your actual path

// Load the logic modules
const { render: renderIndex } = require(path.join(TEMPLATE_DIR, "index.js"));
const { render: renderArtist } = require(path.join(TEMPLATE_DIR, "artist.js"));
const { render: renderWatch } = require(path.join(TEMPLATE_DIR, "watch.js"));

function buildAll(artists) {
  // 1. Build Index
  try {
    const indexHtml = renderIndex(artists);
    fs.writeFileSync(path.join(PUBLIC_DIR, "index.html"), indexHtml);

    // 2. Build Artist and Watch Pages
    Object.keys(artists).forEach((slug) => {
      const artist = artists[slug];

      // Build Artist Page
      const artistHtml = renderArtist(artist);
      const artistDir = path.join(PUBLIC_DIR, "artists", slug);
      fs.mkdirSync(artistDir, { recursive: true });
      fs.writeFileSync(path.join(artistDir, "index.html"), artistHtml);

      // Build individual Watch Pages for every performance
      (artist.performances || []).forEach((p) => {
        const watchHtml = renderWatch(p, slug, artist.name);
        const watchDir = path.join(artistDir, p.ID);

        fs.mkdirSync(watchDir, { recursive: true });
        fs.writeFileSync(path.join(watchDir, "index.html"), watchHtml);
      });
    });

    console.log("🚀 Build complete: Flat template structure processed.");
  } catch (e) {
    console.log(e);
  }
}

module.exports = buildAll;
