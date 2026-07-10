// src/templates/index.js

/**
 * Renders the full HTML document for the root archive index page.
 * @param {Object} artists - Master database catalog block containing all parsed artist profiles.
 * @returns {string} Raw HTML payload
 */
function render(artists) {
  const totalArtists = Object.keys(artists).length;

  return `<!doctype html>
<html lang="en">
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Live Archive | All Artists</title>
        <link rel="stylesheet" href="/css/main.css">
        <script defer src="/js/alpine.js"></script>
        <script defer src="/js/app.js"></script>
    </head>
    <body>
        <div class="artist-hero" style="background-image: linear-gradient(rgba(4, 7, 20, 0.4), rgba(4, 7, 20, 1)), url('/screenshots/full/archive-banner-fallback.jpg')">
            <div class="hero-overlay">
                <h1>live archive</h1>
                <p class="performance-count">${totalArtists} Artists Curated</p>
            </div>
        </div>

        <main class="performance-grid">
            ${Object.keys(artists)
              .map((slug) => {
                const artist = artists[slug];
                const totalPerformances = artist.performances
                  ? artist.performances.length
                  : 0;

                // Dynamically route standard image path to the lightweight web card directory
                const cardImage = artist.photo
                  ? artist.photo.replace("/screenshots/", "/screenshots/cards/")
                  : "";

                return `
                <a href="/artists/${slug}" class="card artist-card" style="text-decoration: none; color: inherit; display: block;">
                    <div class="card-thumbnail" style="background-image: url('${cardImage}')"></div>
                    
                    <div class="card-metadata">
                        <h3>${artist.name}</h3>
                        <p class="date" style="margin-bottom: 0;">${totalPerformances} ${totalPerformances === 1 ? "Performance" : "Performances"}</p>
                    </div>
                </a>
                `;
              })
              .join("")}
        </main>

        <script>
            // Passive Pre-rendering & Engine Prefetch Hook
            window.addEventListener("DOMContentLoaded", () => {
                const prefetch = (url) => {
                    if (!document.querySelector(\`link[href="\${url}"]\`)) {
                        const link = document.createElement("link");
                        link.rel = "prefetch";
                        link.href = url;
                        document.head.appendChild(link);
                    }
                };
                document.querySelectorAll(".artist-card").forEach(card => {
                    card.addEventListener("mouseover", () => prefetch(card.getAttribute('href')), { once: true });
                });
            });
        </script>
    </body>
</html>`;
}

module.exports = { render };
