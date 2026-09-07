import { Menu } from "../../components/Menu";
import { HeroImage } from "../../components/HeroImage";
import { getHeroImage } from "../../formatSegments/getHeroImage";

export const NotFoundPageLayout = () => {
  return (
    <html lang="en">
      <head>
        <link
          rel="icon"
          type="image/png"
          href="/favicon-96x96.png"
          sizes="96x96"
        />
        <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
        <link rel="shortcut icon" href="/favicon.ico" />
        <link
          rel="apple-touch-icon"
          sizes="180x180"
          href="/apple-touch-icon.png"
        />
        <link rel="manifest" href="/site.webmanifest" />
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Not Found</title>
        <link rel="stylesheet" href="/css/main.css" />
      </head>
      <body>
        <div class="menu-container">
          <Menu />
        </div>

        <div
          id="portfolio-hero-container"
          data-bind-class="portfolio.isLoading ? 'hero-container is-loading' : 'hero-container'"
        >
          <div class="artist-hero">
            <HeroImage heroImage={getHeroImage("playlists")} />

            <div class="hero-overlay">
              <h1 class="capitalize-words">Not Found</h1>
              <h3>Use the search to find an artist</h3>
            </div>
          </div>
        </div>
      </body>
    </html>
  );
};
