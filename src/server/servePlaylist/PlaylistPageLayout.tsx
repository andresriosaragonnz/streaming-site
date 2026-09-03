import { PlaylistViewPlayer } from "./PlaylistViewPlayer";
import { PlaylistViewSidebar } from "./PlaylistViewSidebar";
import { PlaylistSegmentCard } from "./PlaylistSegmentCard";
import type { Segment } from "../../ts/types";
import { ToastContainer } from "../../components/ToastContainer";

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
        <title>Playlist</title>
        <link rel="stylesheet" href="/css/review-studio.css" />
      </head>
      <body>
        <ToastContainer />
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
