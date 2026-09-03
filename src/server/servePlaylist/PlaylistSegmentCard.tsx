import { ItemThumbnail } from "../../components/ItemThumbnail";
import { DeleteButton } from "../../components/DeleteButton";

export interface PlaylistSegmentCardProps {
  index: number;
  title: string;
  formattedArtist: string;
  cardImage: string;
  id: string;
}

export const PlaylistSegmentCard = ({
  index,
  title,
  formattedArtist,
  cardImage,
  id,
}: PlaylistSegmentCardProps) => {
  const cardId = `playlist-segment-card-${index}`;

  return (
    <div
      id={cardId}
      class="sidebar-item-card"
      draggable="true"
      data-bind-class-toggle={`is-active:player.isSegmentActive_${index}`}
      onclick={`window.playerStore.selectSegment(${index})`}
      ondragstart={`window.playlistDragEngine?.handleDragStart(${index}, event)`}
      /* CRITICAL: event.preventDefault() MUST run on dragover */
      ondragover="event.preventDefault(); window.playlistDragEngine?.handleDragOver(event)"
      ondrop={`window.playlistDragEngine?.handleDrop(${index}, event)`}
      ondragend="window.playlistDragEngine?.handleDragEnd()"
    >
      <div class="item-meta">
        <ItemThumbnail cardImage={cardImage} title={title} />
      </div>
      <div class="title-text">
        <span>{title}</span>
      </div>
      <div class="title-text justified-line">
        <span>{formattedArtist}</span>
        <DeleteButton
          itemKey={`${index}`}
          actionPath="playlist.deleteItemFromActivePlaylist"
          onclick={`
            event.stopPropagation();
            window.playlistStore?.deleteItemFromActivePlaylist("${id}");
          `}
        />
      </div>
    </div>
  );
};
