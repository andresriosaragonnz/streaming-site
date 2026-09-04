import { ItemThumbnail } from "../../components/ItemThumbnail";
import { ShareIcon } from "../../components/ShareIcon";

export interface PlaylistCardProps {
  playlistName: string;
  playlistLength: number | string;
  altImage: string;
  cardImage: string;
}

export const PlaylistCard = ({
  playlistName,
  playlistLength,
  altImage,
  cardImage,
}: PlaylistCardProps) => (
  <div class="card" data-bg={altImage} data-playlist-name={playlistName}>
    {/* Image Link */}
    <a
      href="#"
      data-card-link
      data-bind-href={`portfolio.getShareUrl('${playlistName}')`}
      style="text-decoration: none; color: inherit; display: block;"
    >
      <ItemThumbnail cardImage={cardImage} title={playlistName} />
    </a>

    {/* Metadata Row */}
    <div class="card-metadata">
      {/* Text Link */}
      <a
        href="#"
        data-card-link
        data-bind-href={`portfolio.getShareUrl('${playlistName}')`}
        style="text-decoration: none; color: inherit; display: block;"
      >
        <h3 class="capitalize-words h3">{playlistName}</h3>
        <p class="date">{playlistLength} tracks</p>
      </a>

      {/* Share Action Trigger */}
      <button
        type="button"
        class="share-btn"
        data-action="copy-portfolio-share-link"
        data-playlist-name={playlistName}
        style="background: none; border: none; padding: 0; cursor: pointer; color: inherit;"
        aria-label={`Share ${playlistName} playlist`}
      >
        <ShareIcon />
      </button>
    </div>
  </div>
);
