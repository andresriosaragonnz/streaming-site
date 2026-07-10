// src/templates/artist.js
const fs = require("fs");
const path = require("path");

function render(artist) {
  const templatePath = path.join(__dirname, "artist.html");
  let html = fs.readFileSync(templatePath, "utf8");

  const heroImage = artist.photo
    ? artist.photo.replace("/screenshots/", "/screenshots/full/")
    : "";

  const gridHtml = (artist.performances || [])
    .map((p) => {
      const cardImage = p.ImageURL
        ? p.ImageURL.replace("/screenshots/", "/screenshots/cards/")
        : heroImage.replace("/full/", "/cards/");

      // Wrap card in an anchor tag to link to your new watch page
      return `
        <a href="/artists/${artist.name}/${p.ID}" class="card" style="text-decoration: none; color: inherit;">
            <div class="card-thumbnail" style="background-image: url('${cardImage}')"></div>
            <div class="card-metadata">
                <h3>${p.VenueName || "Unknown Venue"}</h3>
                <p class="date">${p.EventDate || "Undated Tapes"}</p>
            </div>
        </a>
        `;
    })
    .join("");

  return `<!doctype html>
<html lang="en">
    <head>
        <meta charset="utf-8">
        <title>${artist.name} | Live Archive</title>
        <link rel="stylesheet" href="/css/main.css">
        <script defer src="/js/alpine.js"></script>
        <script defer src="/js/app.js"></script>
    </head>
    <body>
        ${html
          .replace("{{HERO_IMAGE}}", heroImage)
          .replace("{{ARTIST_NAME}}", artist.name)
          .replace(
            "{{PERFORMANCE_COUNT}}",
            artist.performances ? artist.performances.length : 0,
          )
          .replace("{{PERFORMANCE_GRID}}", gridHtml)}
    </body>
</html>`;
}

module.exports = { render };
