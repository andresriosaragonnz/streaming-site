import { CardThumbnail } from "../../../components/CardThumbnail";

export interface PublicSegmentCardProps {
  index: number;
  title: string;
  cardImage: string;
}

export const PublicSegmentCard = ({
  index,
  title,
  cardImage,
}: PublicSegmentCardProps) => (
  <div
    x-on:click={`$store.player.selectSegment(${index})`}
    class="sidebar-item-card"
  >
    <div class="item-meta">
      <CardThumbnail cardImage={cardImage} altText={title} />
    </div>
    <div class="title-text">
      <span>{title}</span>
    </div>
  </div>
);
