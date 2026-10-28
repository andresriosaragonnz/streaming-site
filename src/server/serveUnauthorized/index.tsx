import { Menu } from "../../components/Menu";
import { getHeroImage } from "../../formatSegments/getHeroImage";
import { HeroImage } from "../../components/HeroImage";

export const UnauthorizedPageLayout = ({}) => {
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
        <title>Unauthorized</title>
        <link rel="stylesheet" href="/css/main.css" />
      </head>
      <body>
        <div class="menu-container">
          <Menu />
        </div>

        <div class="artist-hero">
          <HeroImage heroImage={getHeroImage("playlists")} />
          <div class="hero-overlay">
            <div class="studio-container">
              <h3 class="capitalize-words">
                You do not have the right authorization to view this page in
                this device.
              </h3>
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
