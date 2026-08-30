import { Menu } from "../../../components/Menu";
import { PublicPortfolioHero } from "./PublicPortfolioHero";
import {
  PublicPerformanceCard,
  PublicPerformanceCardProps,
} from "./PublicPerformanceCard";
import { GraphModal } from "./GraphModal";
import type { Segment, PerformanceData } from "../../../ts/types";
import { getRandomIndex } from "../../../compiler/utils/getRandomIndex";
import { getRandomElements } from "../../../compiler/utils/getRandomElement";

export interface PublicPortfolioLayoutProps {
  performances: PerformanceData[];
  segments: Segment[];
  graphDataJS?: Record<string, any> | Array<any>;
}

export const PublicPortfolioLayout = ({
  performances = [],
  segments,
  graphDataJS = [],
}: PublicPortfolioLayoutProps) => {
  const portfolioImages = [] as string[][];
  const { formattedArtist, artistId } = segments[0];

  const cards = performances.map((performance) => {
    const {
      images,
      link,
      cardImage,
      altImage,
      formattedVenueName,
      formattedDate,
    } = performance;
    const random = getRandomElements(images, 8);
    portfolioImages.push(random);
    return (
      <PublicPerformanceCard
        link={link}
        altImage={altImage}
        cardImage={cardImage}
        formattedVenueName={formattedVenueName}
        formattedDate={formattedDate}
      />
    );
  });
  const flattedImagesArray = portfolioImages.flat();
  return (
    <html lang="en">
      <head>
        <script type="application/json" id="page-images">
          {JSON.stringify(flattedImagesArray)}
        </script>
        <style>{`[x-cloak] { display: none !important; }`}</style>
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
        <title>Performance</title>
        <link rel="stylesheet" href="/css/main.css" />
        <script src="/js/orb.js"></script>
      </head>
      <body x-data="{ isGraphDrawerOpen: false }">
        <div class="menu-container">
          <Menu />
        </div>

        <PublicPortfolioHero
          heroImage={segments[getRandomIndex(segments)].heroImage as string}
          title={formattedArtist}
          link={formattedArtist}
          count={performances.length}
        />

        <main class="performance-grid">{cards}</main>

        <GraphModal />

        <script>
          {`window.__GRAPH_DATA__ = ${JSON.stringify(graphDataJS)};`}
        </script>
        <script type="module" src="/js/imageFade.js"></script>
        <script type="module" src="/js/portfolioApp.js"></script>
        <script type="module" src="/js/network.js"></script>
      </body>
    </html>
  );
};
