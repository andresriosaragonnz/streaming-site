import { Menu } from "../../../components/Menu";
import { PublicPortfolioHero } from "./PublicPortfolioHero";
import { PublicPerformanceCard } from "./PublicPerformanceCard";
import { GraphModal } from "./GraphModal";
import type { Segment, PerformanceData } from "../../../ts/types";
import { getRandomIndex } from "../../../compiler/utils/getRandomIndex";
import { getRandomElements } from "../../../compiler/utils/getRandomElement";

export interface PublicPortfolioLayoutProps {
  performances: PerformanceData[];
  segments: Segment[];
  graphDataJS?: string;
}

// 1. Raw static HTML shell
const PORTFOLIO_SHELL_RAW = (
  <html lang="en">
    <head>
      <script src="/js/orb.js"></script>
      <script type="application/json" id="page-images">
        {"<!-- SLOT -->"}
      </script>
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
    </head>
    <body>
      <div class="menu-container">
        <Menu />
      </div>

      {"<!-- SLOT -->"}

      <main class="performance-grid">{"<!-- SLOT -->"}</main>

      <GraphModal />

      {"<!-- SLOT -->"}
      <script type="module" src="/js/imageFade.js"></script>
      <script type="module" src="/js/portfolioApp.js"></script>
      <script type="module" src="/js/network.js"></script>
    </body>
  </html>
).toString();

// 2. Pre-split shell into static string fragments ONCE on module import
const [
  PORTFOLIO_HEAD,
  PORTFOLIO_AFTER_IMAGES,
  PORTFOLIO_AFTER_HERO,
  PORTFOLIO_AFTER_CARDS,
  PORTFOLIO_TAIL,
] = PORTFOLIO_SHELL_RAW.split("<!-- SLOT -->");

export const PublicPortfolioLayout = ({
  performances = [],
  segments,
  graphDataJS = "[]",
}: PublicPortfolioLayoutProps) => {
  const portfolioImages: string[][] = [];
  const { formattedArtist } = segments[0] ?? {};

  // Render dynamic cards
  const cardsHtml = performances
    .map((performance) => {
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
      ).toString();
    })
    .join("");

  const flattedImages = portfolioImages.flat();
  const heroImage =
    (segments[getRandomIndex(segments)]?.heroImage as string) || "";

  // Render dynamic hero
  const heroHtml = (
    <PublicPortfolioHero
      heroImage={heroImage}
      title={formattedArtist}
      link={formattedArtist}
      count={performances.length}
    />
  ).toString();

  const graphScriptHtml = `<script>window.__GRAPH_DATA__ = ${graphDataJS};</script>`;

  // 3. Fast Zero-Copy Assembly via Array.join()
  return [
    PORTFOLIO_HEAD,
    JSON.stringify(flattedImages),
    PORTFOLIO_AFTER_IMAGES,
    heroHtml,
    PORTFOLIO_AFTER_HERO,
    cardsHtml,
    PORTFOLIO_AFTER_CARDS,
    graphScriptHtml,
    PORTFOLIO_TAIL,
  ].join("");
};
