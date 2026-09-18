import { PlaylistViewPlayer } from "./PlaylistViewPlayer";
import { PlaylistViewSidebar } from "./PlaylistViewSidebar";
import { PlaylistSegmentCard } from "./PlaylistSegmentCard";
import type { Segment } from "../../ts/types";
import { Toast } from "../../components/ToastContainer";
import { Favicon } from "../../components/Favicon";

export interface PlaylistPageLayoutProps {
  segments: Segment[];
  pageTitle: string;
}

export const PlaylistPageLayout = ({
  pageTitle,
  segments,
}: PlaylistPageLayoutProps) => {
  const firstSegment = segments[0] ?? {
    cardImage: "",
    sourceMp3: "",
    formattedTitle: "",
    artistLink: "",
    formattedArtist: "",
  };

  const { cardImage, sourceMp3, formattedTitle, artistLink, formattedArtist } =
    firstSegment;

  const cards = segments.map((segment, index) => (
    <PlaylistSegmentCard
      index={index}
      title={segment.title}
      formattedArtist={segment.formattedArtist}
      cardImage={segment.cardImage}
      id={segment.id}
    />
  ));

  return (
    <html lang="en">
      <head>
        <Favicon />
        <title>Playlist</title>
        <link rel="stylesheet" href="/css/review-studio.css" />
      </head>
      <body>
        <Toast />
        <div class="studio-container">
          <PlaylistViewPlayer
            pageTitle={pageTitle}
            firstTitle={formattedTitle}
            posterImage={cardImage}
            firstMp3={sourceMp3}
          />
          <PlaylistViewSidebar
            artistLink={artistLink}
            artistName={formattedArtist}
            cards={cards}
            pageTitle={pageTitle}
          />
        </div>

        <script type="application/json" id="studio-segments-data">
          {JSON.stringify(segments)}
        </script>
      </body>
      <script type="module" src="/js/playlistApp.js"></script>
    </html>
  );
};
