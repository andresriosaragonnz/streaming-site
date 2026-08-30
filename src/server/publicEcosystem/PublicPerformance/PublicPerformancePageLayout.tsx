import { PublicViewPlayer } from "./PublicViewPlayer";
import { PublicViewSidebar } from "./PublicViewSidebar";
import { PublicSegmentCard } from "./PublicSegmentCard";
import { ToastNotification } from "../../../components/ToastNotification";
import type { Segment } from "../../../ts/types";

export const PublicPerformancePageLayout = ({
  segments = [],
}: {
  segments: Segment[];
}) => {
  const firstSegment = segments[0] ?? {
    cardImage: "",
    sourceMp3: "",
    formattedTitle: "",
    artistLink: "",
    formattedArtist: "",
  };

  const {
    cardImage,
    sourceMp3,
    formattedTitle,
    artistLink,
    formattedArtist,
    formattedPerformance,
  } = firstSegment;
  console.log({ firstSegment });
  const cards = segments.map((segment, index) => (
    <PublicSegmentCard
      index={index}
      title={segment.formattedTitle}
      cardImage={segment.cardImage}
    />
  ));

  return (
    <html lang="en">
      <head>
        <style>{`[x-cloak] { display: none !important; }`}</style>
        <link
          rel="preload"
          as="image"
          href={`${cardImage}.jpg`}
          type="image/jpeg"
        />
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
        <ToastNotification />
        <div class="studio-container" x-data="publicWorkspace">
          <PublicViewPlayer
            studioTitle={`${formattedPerformance}`}
            firstTitle={formattedTitle}
            firstMp3={sourceMp3}
            posterImage={`${cardImage}.jpg`}
          />
          <PublicViewSidebar
            cards={cards}
            artistLink={artistLink}
            artistName={formattedArtist}
          />
        </div>

        <script type="application/json" id="studio-segments-data">
          {JSON.stringify(segments)}
        </script>
      </body>
      <script type="module" src="/js/publicApp.js"></script>
    </html>
  );
};
