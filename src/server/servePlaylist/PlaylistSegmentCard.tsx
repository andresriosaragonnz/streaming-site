import { CardThumbnail } from "../../components/CardThumbnail";
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
      data-id={id}
      class="sidebar-item-card"
      draggable="true"
      data-action="select-segment"
      data-bind-class={`player.state.activeId === '${id}' ? 'sidebar-item-card is-active' : 'sidebar-item-card'`}
      ondragstart={`window.playlistDragEngine?.handleDragStart(${index}, event)`}
      /* CRITICAL: event.preventDefault() MUST run on dragover */
      ondragover="event.preventDefault(); window.playlistDragEngine?.handleDragOver(event)"
      ondrop={`window.playlistDragEngine?.handleDrop(${index}, event)`}
      ondragend="window.playlistDragEngine?.handleDragEnd()"
    >
      <div class="item-meta">
        <CardThumbnail cardImage={cardImage} altText={title} />
      </div>
      <div class="item-meta">
        <div class="title-text">
          <span class="segment-duration">{title}</span>
          <span class="segment-duration">{formattedArtist}</span>
        </div>
        <DeleteButton action="delete-playlist-item" id={id} />
      </div>
    </div>
  );
};
