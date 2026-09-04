import { CardThumbnail } from "../../../components/CardThumbnail";

export interface PublicSegmentCardProps {
  id: string;
  title: string;
  cardImage: string;
  duration?: string;
  isSelected?: boolean;
}

export const PublicSegmentCard = ({
  id,
  title,
  cardImage,
  duration,
  isSelected = false,
}: PublicSegmentCardProps) => (
  <div
    class={`sidebar-item-card ${isSelected ? "is-selected" : ""}`}
    data-action="select-segment"
    data-id={id}
    role="button"
    tabindex={0}
    aria-label={`Play ${title}`}
    aria-selected={isSelected}
  >
    <div class="item-meta">
      <CardThumbnail cardImage={cardImage} altText={title} />
    </div>

    <div class="title-text">
      <span class="segment-duration">{title}</span>
      <span class="segment-duration">{duration}</span>
    </div>
  </div>
);
