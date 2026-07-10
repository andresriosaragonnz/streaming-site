const fs = require("fs");
const path = require("path");

/**
 * Renders the watch page by pulling the combined library/video ID string from JSON.
 */
function render(performance, artistSlug, artistName) {
  const templatePath = path.join(__dirname, "watch.html");
  let html = fs.readFileSync(templatePath, "utf8");

  const STREAM_HOST = "vz-4ff23d64-404.b-cdn.net.";

  // 2. Extract just the video ID from your "680917/178f2d5b-..." JSON property
  let hlsUrl = "";
  if (performance.video) {
    hlsUrl = `https://${STREAM_HOST}/${performance.video}/playlist.m3u8`;
  }

  // 3. Keep your standard variable replacements down here...
  html = html.replace(/{{HLS_URL}}/g, hlsUrl);
  // 3. Inject parsed values into your watch.html placeholders
  html = html
    .replace(/{{HLS_URL}}/g, hlsUrl)
    .replace(/{{VENUE_NAME}}/g, performance.VenueName || "Live Performance")
    .replace(/{{ARTIST_NAME}}/g, artistName)
    .replace(/{{EVENT_DATE}}/g, performance.EventDate || "Archive Date");

  // 4. Return full compiled payload with layout shells
  return `<!doctype html>
<html lang="en">
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${performance.VenueName || "Live"} | ${artistName} | Live Archive</title>
        <link rel="stylesheet" href="/css/main.css">
        <link rel="stylesheet" href="https://cdn.plyr.io/3.7.8/plyr.css" />
    </head>
    <body style="background: #040714; color: #fff; margin:0; font-family: sans-serif;">
        <header style="padding: 20px;">
            <a href="/artists/${artistSlug}" style="color: rgba(255,255,255,0.6); text-decoration: none;">← Back to ${artistName}</a>
        </header>

        <main style="max-width: 1200px; margin: 0 auto; padding: 0 20px;">
            ${html}
        </main>

        <script src="https://cdn.plyr.io/3.7.8/plyr.polyfilled.js"></script>
        <script src="https://cdn.jsdelivr.net/npm/hls.js@1.5.8/dist/hls.min.js"></script>
        <script>
            document.addEventListener('DOMContentLoaded', () => {
                const video = document.querySelector('#cinema-player');
                if (!video) return;

                const sourceUrl = "${hlsUrl}";
                const player = new Plyr(video, {
                    controls: ['play-large', 'play', 'progress', 'current-time', 'mute', 'volume', 'settings', 'fullscreen']
                });
                
                if (Hls.isSupported() && sourceUrl) {
                    const hls = new Hls();
                    hls.loadSource(sourceUrl);
                    hls.attachMedia(video);
                }
            });
        </script>
    </body>
</html>`;
}

module.exports = { render };
