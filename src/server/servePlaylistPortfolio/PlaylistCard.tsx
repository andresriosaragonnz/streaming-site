import { ItemThumbnail } from "../../components/ItemThumbnail";
import { ShareIcon } from "../../components/ShareIcon";

export interface PlaylistCardProps {
  playlistName: string;
  playlistLength: number | string;
  altImage: string;
  cardImage: string;
  shareUrl?: string;
}

export const PlaylistCard = ({
  playlistName,
  playlistLength,
  altImage,
  cardImage,
  shareUrl = "#",
}: PlaylistCardProps) => (
  <div class="card" data-bg={altImage}>
    {/* Image Link */}
    <a
      href={shareUrl}
      data-bind-href={`playlist.getShareUrl('${playlistName}')`}
      style="text-decoration: none; color: inherit; display: block"
    >
      <ItemThumbnail cardImage={cardImage} title={playlistName} />
    </a>

    {/* Metadata Row */}
    <div class="card-metadata">
      {/* Text Link */}
      <a
        href={shareUrl}
        data-bind-href={`playlist.getShareUrl('${playlistName}')`}
        style="text-decoration: none; color: inherit; display: block"
      >
        <h3 class="capitalize-words h3">{playlistName}</h3>
        <p class="date">{playlistLength} songs</p>
      </a>

      {/* Separate Share Action */}
      <div
        style="cursor: pointer;"
        onclick={`window.playlistStore?.generateShareLink('${playlistName}')`}
      >
        <ShareIcon />
      </div>
    </div>
  </div>
);
