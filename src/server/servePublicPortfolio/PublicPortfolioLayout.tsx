import { formatSegments } from "../../formatSegments";
import { getPerformancesFromSegments } from "../../formatSegments/utils/getPerformancesFromSegments";
import { getRandomElements } from "../../formatSegments/utils/getRandomElement";
import { getRandomIndex } from "../../formatSegments/utils/getRandomIndex";
import { Menu } from "../../components/Menu";
import { GraphModal } from "../../components/GraphModal";
import { PublicPerformanceCard } from "./PublicPerformanceCard";
import { PublicPortfolioHero } from "./PublicPortfolioHero";
import type { Segment } from "../../ts/types";

export interface PublicPortfolioLayoutProps {
  segments: Segment[];
  graphDataJS?: string;
}

export const PublicPortfolioLayout = ({
  segments = [],
  graphDataJS = "[]",
}: PublicPortfolioLayoutProps) => {
  // 1. Process and format segments
  const { formattedSegments } = formatSegments(segments);
  const firstSegment = formattedSegments[0] ?? {};
  const { formattedArtist, artistName } = firstSegment;

  // 2. Extract performance groupings (pulling public performances)
  const performances = getPerformancesFromSegments(formattedSegments);
  const publicPerformances = performances.public ?? [];

  const portfolioImages: string[][] = [];

  // 3. Render PublicPerformanceCards and collect portfolio images & prefetch URLs
  const cards = publicPerformances.map((performance) => {
    const { images } = performance;
    const random = getRandomElements(images, 8);
    portfolioImages.push(random);

    return <PublicPerformanceCard {...performance} />;
  });

  const flattedImages = portfolioImages.flat();

  // Extract up to 6 unique target links for head prefetching
  const prefetchUrls = Array.from(
    new Set(publicPerformances.map((p: any) => p.link).filter(Boolean)),
  ).slice(0, 6);

  // Pick a random hero image from available segments
  const heroImage =
    formattedSegments[getRandomIndex(formattedSegments)]?.heroImage || "";

  return (
    <html lang="en">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>
          {formattedArtist ? `${formattedArtist} - Portfolio` : "Performance"}
        </title>

        {/* Prefetch links to speed up navigation to public performances */}
        {prefetchUrls.map((url) => {
          const href = url.startsWith("/") ? url : `/${url}`;
          return <link rel="prefetch" href={href} as="document" />;
        })}
        <link rel="stylesheet" href="/css/main.css" />
        <script src="/js/orb.js"></script>

        {/* Image data payload for client-side scripts */}
        <script type="application/json" id="page-images">
          {JSON.stringify(flattedImages)}
        </script>
      </head>
      <body>
        <div class="menu-container">
          <Menu />
        </div>

        <PublicPortfolioHero
          heroImage={heroImage}
          title={formattedArtist}
          link={artistName}
          count={publicPerformances.length}
        />

        <main class="performance-grid">{cards}</main>

        <GraphModal />

        {/* Global Graph Data Script */}
        <script>{`window.__GRAPH_DATA__ = ${graphDataJS};`}</script>

        {/* Client Scripts */}
        <script type="module" src="/js/imageFade.js"></script>
        <script type="module" src="/js/portfolioApp.js"></script>
        <script type="module" src="/js/network.js"></script>
      </body>
    </html>
  );
};
