import { Menu } from "../../components/Menu";
import { PlaylistHero } from "./PlaylistHero";
import { PlaylistCard } from "./PlaylistCard";
import { getCardImage } from "../../compiler/formatSegments/getCardImage";
import { getHeroImage } from "../../compiler/formatSegments/getHeroImage";
import { getRandomIndex } from "../../compiler/utils/getRandomIndex";

export interface PlaylistPortfolioLayoutProps {
  ids: string[];
  names: string[];
  ls: string[];
}

export const PlaylistPortfolioLayout = ({
  ids,
  names,
  ls,
}: PlaylistPortfolioLayoutProps) => {
  let count = 0;

  const portfolioImages = [] as string[];
  const cards = ids.map((id, index) => {
    const image = getCardImage(id);
    count += parseInt(ls[index]);
    const heroImage = getHeroImage(ids[index]);
    portfolioImages.push(heroImage);
    return (
      <PlaylistCard
        playlistName={names[index]}
        playlistLength={ls[index]}
        altImage={image}
        cardImage={image}
      />
    );
  });

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
        <title>My Playlists</title>
        <link rel="stylesheet" href="/css/main.css" />
      </head>
      <body>
        <div class="menu-container">
          <Menu />
        </div>
        <PlaylistHero
          heroImage={portfolioImages[getRandomIndex(portfolioImages)]}
          count={ids.length}
        />
        <main class="performance-grid" id="performance-grid">
          {cards}
        </main>
      </body>
      <script type="module" src="/js/playlistPortfolioInit.js"></script>
      <script type="module" src="/js/portfolioApp.js"></script>
      <script type="module" src="/js/imageFade.js"></script>
    </html>
  );
};
