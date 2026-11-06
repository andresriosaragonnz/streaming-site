import { PrivateViewPlayer } from "./PrivateViewPlayer";
import { PrivateViewSidebar } from "./PrivateViewSidebar";
import { PrivateSegmentCard } from "./PrivateSegmentCard";
import { Toast } from "../../components/ToastContainer";
import { Favicon } from "../../components/Favicon";

export interface SegmentDataItem {
  title: string;
  status: string;
  formatedDuration: string;
  cardImage: string;
  segmentToken: string;
}

export interface PrivatePerformancePageLayoutProps {
  formattedSegments: any[];
}

export const PrivatePerformancePageLayout = ({
  formattedSegments = [],
}: PrivatePerformancePageLayoutProps) => {
  const {
    cardImage,
    formattedArtist,
    venueName,
    formattedDate,
    artistName,
    eventDate,
    masterSize,
    segmentToken,
  } = formattedSegments[0];
  const posterImage = segmentToken
    ? `${cardImage}.jpg?token=${encodeURIComponent(segmentToken)}`
    : `${cardImage}.jpg`;
  const cards = formattedSegments.map((segment, index) => (
    <PrivateSegmentCard
      index={index}
      id={segment.id}
      title={segment.title}
      status={segment.status}
      formatedDuration={segment.formatedDuration}
      cardImage={segment.cardImage}
      segmentToken={segment.segmentToken}
    />
  ));
  return (
    <html lang="en">
      <head>
        <Favicon />
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Performance</title>
        <link rel="stylesheet" href="/css/review-studio.css" />
      </head>
      <body>
        <Toast />
        <div class="studio-container">
          <PrivateViewPlayer
            studioTitle={`${formattedArtist}-${venueName}-${formattedDate}`}
            artistName={artistName}
            posterImage={posterImage}
            segments={formattedSegments}
            performance={`${venueName}-${eventDate}`}
            masterSize={masterSize}
          />
          <PrivateViewSidebar cards={cards} />
        </div>
        <script type="application/json" id="studio-segments-data">
          {JSON.stringify(formattedSegments)}
        </script>
      </body>
      <script type="module" src="/js/privateApp.js"></script>
    </html>
  );
};
