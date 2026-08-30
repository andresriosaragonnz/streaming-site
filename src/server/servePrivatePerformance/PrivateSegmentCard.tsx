import { CardThumbnail } from "../../components/CardThumbnail";

export interface PrivateSegmentCardProps {
  index: number;
  title: string;
  status: string;
  formatedDuration: string;
  cardImage: string;
}

export const PrivateSegmentCard = ({
  index,
  title,
  status,
  formatedDuration,
  cardImage,
}: PrivateSegmentCardProps) => (
  <div
    x-on:click={`$store.player.selectSegment(${index})`}
    class="sidebar-item-card"
    x-bind:class={`$store.player.currentIndex === ${index} ? 'item-active-highlight' : ''`}
  >
    <div class="item-meta">
      <CardThumbnail cardImage={cardImage} altText={title} />

      <div class="status-text">
        <span
          x-text={`$store.player.segments[${index}]?.status === 'public' ? 'Public' : 'Private'`}
        >
          {status}
        </span>
        <span>{formatedDuration}</span>
      </div>
    </div>

    <div class="title-text">
      <span x-text={`$store.player.segments[${index}]?.title`}>{title}</span>
    </div>
  </div>
);
