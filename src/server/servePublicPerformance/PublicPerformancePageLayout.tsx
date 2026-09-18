import { PublicViewPlayer } from "./PublicViewPlayer";
import { PublicViewSidebar } from "./PublicViewSidebar";
import { PublicSegmentCard } from "./PublicSegmentCard";
import { Toast } from "../../components/ToastContainer";
import { Favicon } from "../../components/Favicon";
import type { Segment } from "../../ts/types";
import { formatSegments } from "../../formatSegments";
import { GraphModal } from "../../components/GraphModal";

export interface PublicPerformancePageLayoutProps {
  segments: Segment[];
  graphDataJS: string;
}

export const PublicPerformancePageLayout = ({
  segments = [],
  graphDataJS,
}: PublicPerformancePageLayoutProps) => {
  const { formattedSegments, totalDuration } = formatSegments(segments);
  const firstSegment = formattedSegments[0] ?? {
    cardImage: "",
    sourceMp3: "",
    formattedTitle: "",
    artistName: "",
    formattedArtist: "",
    formattedPerformance: "",
    formattedVenue: "",
    formattedDate: "",
  };

  const {
    cardImage,
    sourceMp3,
    formattedTitle,
    artistName,
    formattedArtist,
    formattedPerformance,
    formattedVenue,
    formattedDate,
  } = firstSegment;
  const cards = formattedSegments.map((segment) => (
    <PublicSegmentCard
      id={segment.id}
      title={segment.formattedTitle}
      cardImage={segment.cardImage}
      duration={segment.formatedDuration}
    />
  ));

  return (
    <html lang="en">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>{formattedPerformance || "Performance"}</title>

        <Favicon />

        {/* High-priority poster image preload */}
        {cardImage && (
          <link
            rel="preload"
            as="image"
            fetchpriority="high"
            href={`${cardImage}.jpg`}
            type="image/jpeg"
          />
        )}

        <link rel="stylesheet" href="/css/review-studio.css" />
        <link rel="stylesheet" href="/css/main.css" />
        <script src="/js/orb.js"></script>
      </head>
      <body>
        <Toast />

        <div class="studio-container">
          <PublicViewPlayer
            studioTitle={`${formattedVenue} ${formattedDate}`}
            firstTitle={formattedTitle}
            firstMp3={sourceMp3}
            posterImage={`${cardImage}.jpg`}
            artistLink={artistName}
            artistName={formattedArtist}
          />

          <PublicViewSidebar
            artistLink={artistName}
            artistName={formattedArtist}
            cards={cards}
          />
        </div>
        <GraphModal />
        {/* Client segment payload ingestion */}
        {/* Global Graph Data Script */}
        <script>{`window.__GRAPH_DATA__ = ${graphDataJS};`}</script>
        <script type="application/json" id="studio-segments-data">
          {JSON.stringify(formattedSegments)}
        </script>

        <script type="module" src="/js/publicApp.js"></script>
        <script type="module" src="/js/network.js"></script>
      </body>
    </html>
  );
};
