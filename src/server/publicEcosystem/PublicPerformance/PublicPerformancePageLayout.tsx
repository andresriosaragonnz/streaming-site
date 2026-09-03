import { PublicViewPlayer } from "./PublicViewPlayer";
import { PublicViewSidebar } from "./PublicViewSidebar";
import { PublicSegmentCard } from "./PublicSegmentCard";
import { ToastContainer } from "../../../components/ToastContainer";
import type { Segment } from "../../../ts/types";

// 1. Raw static HTML shell
const PERFORMANCE_SHELL_RAW = (
  <html lang="en">
    <head>
      {"<!-- SLOT -->"}
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
      <link rel="stylesheet" href="/css/review-studio.css" />
    </head>
    <body>
      <ToastContainer />
      <div class="studio-container">
        {"<!-- SLOT -->"}
        {"<!-- SLOT -->"}
      </div>

      <script type="application/json" id="studio-segments-data">
        {"<!-- SLOT -->"}
      </script>
    </body>
    <script type="module" src="/js/publicApp.js"></script>
  </html>
).toString();

// 2. Pre-split shell into static string fragments ONCE on module import
const [
  PERF_HEAD,
  PERF_AFTER_PRELOAD,
  PERF_AFTER_PLAYER,
  PERF_AFTER_SIDEBAR,
  PERF_TAIL,
] = PERFORMANCE_SHELL_RAW.split("<!-- SLOT -->");

export const PublicPerformancePageLayout = ({
  segments = [],
}: {
  segments: Segment[];
}) => {
  const firstSegment = segments[0] ?? {
    cardImage: "",
    sourceMp3: "",
    formattedTitle: "",
    artistName: "",
    formattedArtist: "",
    formattedPerformance: "",
  };

  const {
    cardImage,
    sourceMp3,
    formattedTitle,
    artistName,
    formattedArtist,
    formattedPerformance,
  } = firstSegment;

  // Render cards
  const cardsHtml = segments
    .map((segment, index) =>
      (
        <PublicSegmentCard
          index={index}
          title={segment.formattedTitle}
          cardImage={segment.cardImage}
        />
      ).toString(),
    )
    .join("");

  // Render inner player & sidebar
  const playerHtml = (
    <PublicViewPlayer
      studioTitle={`${formattedPerformance}`}
      firstTitle={formattedTitle}
      firstMp3={sourceMp3}
      posterImage={`${cardImage}.jpg`}
    />
  ).toString();

  const sidebarHtml = (
    <PublicViewSidebar
      cards={cardsHtml}
      artistLink={artistName}
      artistName={formattedArtist}
    />
  ).toString();

  const preloadHtml = cardImage
    ? `<link rel="preload" as="image" href="${cardImage}.jpg" type="image/jpeg" />`
    : "";

  // 3. Fast Zero-Copy Assembly via Array.join()
  return [
    PERF_HEAD,
    preloadHtml,
    PERF_AFTER_PRELOAD,
    playerHtml,
    PERF_AFTER_PLAYER,
    sidebarHtml,
    PERF_AFTER_SIDEBAR,
    JSON.stringify(segments),
    PERF_TAIL,
  ].join("");
};
