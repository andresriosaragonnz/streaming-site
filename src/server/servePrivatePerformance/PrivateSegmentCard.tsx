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
}: PrivateSegmentCardProps) => {
  return (
    <div
      class="sidebar-item-card"
      data-action="select-segment"
      data-index={index}
      data-bind-active-class={`player.currentIndex === ${index} ? 'item-active-highlight' : ''`}
    >
      <div class="item-meta">
        <CardThumbnail cardImage={cardImage} altText={title} />

        <div class="status-text">
          <span
            data-bind-text={`review.tracks[${index}]?.isPublic ? 'Public' : 'Private'`}
          >
            {status === "public" ? "Public" : "Private"}
          </span>
          <span>{formatedDuration}</span>
        </div>
      </div>

      <div class="title-text">
        <span data-bind-text={`review.tracks[${index}]?.title`}>{title}</span>
      </div>
    </div>
  );
};
