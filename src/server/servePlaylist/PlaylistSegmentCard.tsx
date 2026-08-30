import { ItemThumbnail } from "../../components/ItemThumbnail";

export interface PlaylistSegmentCardProps {
  index: number;
  title: string;
  formattedArtist: string;
  cardImage: string;
}

export const PlaylistSegmentCard = ({
  index,
  title,
  formattedArtist,
  cardImage,
}: PlaylistSegmentCardProps) => (
  <div
    class="sidebar-item-card"
    x-bind:class={`{ 'is-being-dragged': draggedIndex === ${index} }`}
    draggable="true"
    x-on:dragstart={`handleDragStart(${index}, $event)`}
    x-on:dragover="handleDragOver($event)"
    x-on:drop={`handleDrop(${index}, $event)`}
    x-on:dragend="handleDragEnd()"
  >
    <div
      x-on:click={`$store.player.selectSegment(${index})`}
      class="sidebar-item-card"
    >
      <div class="item-meta">
        <ItemThumbnail cardImage={cardImage} title={title} />
      </div>
      <div class="title-text">
        <span>{title}</span>
      </div>
      <div class="title-text">
        <span>{formattedArtist}</span>
      </div>
    </div>
  </div>
);
