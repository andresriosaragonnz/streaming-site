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
    class="sidebar-item-card"
    data-action="select-segment"
    data-index={index}
  >
    <div class="item-meta">
      <CardThumbnail cardImage={cardImage} altText={title} />
    </div>
    <div class="title-text">
      <span>{title}</span>
    </div>
  </div>
);
