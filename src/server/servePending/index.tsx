import { Menu } from "../../components/Menu";
import { getHeroImage } from "../../formatSegments/getHeroImage";
import { HeroImage } from "../../components/HeroImage";

export const PendingLayout = ({}) => {
  return (
    <html lang="en">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Coming soon</title>

        {/* Explicit Icon Definitions with Version Query Strings */}
        <link
          rel="icon"
          type="image/png"
          href="/favicon-96x96.png?v=1"
          sizes="96x96"
        />
        <link rel="icon" type="image/svg+xml" href="/favicon.svg?v=1" />
        <link rel="shortcut icon" href="/favicon.ico?v=1" />
        <link
          rel="apple-touch-icon"
          sizes="180x180"
          href="/apple-touch-icon.png?v=1"
        />
        <link rel="mask-icon" href="/favicon.svg?v=1" color="#000000" />
        <link rel="manifest" href="/site.webmanifest?v=1" />

        <link rel="stylesheet" href="/css/main.css?v=1" />
      </head>
      <body>
        <div class="menu-container">
          <Menu />
        </div>

        <div class="artist-hero">
          <HeroImage heroImage={getHeroImage("playlists")} />
          <div class="hero-overlay">
            <div class="studio-container">
              <h3 class="capitalize-words">Coming soon</h3>
            </div>

            <div class="studio-container">
              <h3 class="capitalize-words">
                Contact your videographer to get an authorization token.
              </h3>
            </div>
          </div>
        </div>
      </body>
    </html>
  );
};
