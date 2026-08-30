import { PrivateViewPlayer } from "./PrivateViewPlayer";
import { PrivateViewSidebar } from "./PrivateViewSidebar";
import { formatSegments } from "../../compiler/formatSegments/index";
import { PrivateSegmentCard } from "./PrivateSegmentCard";
import { ToastNotification } from "../../components/ToastNotification";

export interface SegmentDataItem {
  title: string;
  status: string;
  formatedDuration: string;
  cardImage: string;
}

export interface PrivatePerformancePageLayoutProps {
  segments: SegmentDataItem[];
}

export const PrivatePerformancePageLayout = ({
  segments = [],
}: PrivatePerformancePageLayoutProps) => {
  const { formattedSegments } = formatSegments(segments);
  const { cardImage, formattedArtist, venueName, formattedDate } =
    formattedSegments[0];
  const cards = formattedSegments.map((segment, index) => (
    <PrivateSegmentCard
      index={index}
      title={segment.title}
      status={segment.status}
      formatedDuration={segment.formatedDuration}
      cardImage={segment.cardImage}
    />
  ));
  return (
    <html lang="en">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Performance</title>
        <link rel="stylesheet" href="/css/review-studio.css" />
      </head>
      <body>
        <div class="studio-container" x-data="privateWorkspace">
          <PrivateViewPlayer
            studioTitle={`${formattedArtist}-${venueName}-${formattedDate}`}
            posterImage={cardImage}
          />
          <PrivateViewSidebar cards={cards} />
        </div>

        <script type="application/json" id="studio-segments-data">
          {JSON.stringify(formattedSegments)}
        </script>

        <ToastNotification />
      </body>
      <script type="module" src="/js/privateApp.js"></script>
    </html>
  );
};
