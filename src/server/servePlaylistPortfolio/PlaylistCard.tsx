import { ItemThumbnail } from "../../components/ItemThumbnail";
import { ShareIcon } from "../../components/ShareIcon";

export interface PlaylistCardProps {
  playlistName: string;
  playlistLength: number | string;
  altImage: string;
  cardImage: string;
  segmentToken?: string;
}

export const PlaylistCard = ({
  playlistName,
  playlistLength,
  altImage,
  cardImage,
  segmentToken,
}: PlaylistCardProps) => {
  const shareGetter = `portfolio.getShareUrl(${JSON.stringify(playlistName)})`;

  return (
    <div
      class="card"
      data-bg={altImage}
      data-image-token={segmentToken}
      data-playlist-name={playlistName}
    >
      {/* Image Link */}
      <a
        href="#"
        data-card-link
        data-bind-href={shareGetter}
        class="u-link-reset u-block"
      >
        <ItemThumbnail
          cardImage={cardImage}
          title={playlistName}
          segmentToken={segmentToken}
        />
      </a>

      {/* Metadata Row */}
      <div class="card-metadata">
        {/* Text Link */}
        <a
          href="#"
          data-card-link
          rel="prefetch"
          data-bind-href={shareGetter}
          class="u-link-reset u-block"
        >
          <h3 class="capitalize-words heading-3">{playlistName}</h3>
          <p class="date">{playlistLength} tracks</p>
        </a>

        {/* Share Action Trigger */}
        <button
          type="button"
          class="share-btn u-bare u-pointer"
          data-action="copy-portfolio-share-link"
          data-playlist-name={playlistName}
            aria-label={`Share ${playlistName} playlist`}
        >
          <ShareIcon />
        </button>
      </div>
    </div>
  );
};
