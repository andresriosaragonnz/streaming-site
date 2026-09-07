import { CardThumbnail } from "../../components/CardThumbnail";

export interface PrivateSegmentCardProps {
  id: string;
  index: number;
  title: string;
  status: string;
  formatedDuration: string;
  cardImage: string;
}

export const PrivateSegmentCard = ({
  id,
  index,
  title,
  status,
  formatedDuration,
  cardImage,
}: PrivateSegmentCardProps) => {
  const isPublic = status === "public";

  return (
    <div
      class="sidebar-item-card"
      data-action="select-segment"
      data-id={id}
      data-index={index}
      data-bind-class-toggle={`item-active-highlight:player.currentIndex === ${index}`}
      role="button"
      tabindex="0"
      aria-label={`Select ${title}`}
    >
      <div class="item-meta">
        <CardThumbnail cardImage={cardImage} altText={title} />

        <div class="status-text">
          {/* Target review.state.tracks so binder evaluates the proxy state array directly */}
          <span
            data-bind-text={`review.tracks[${index}]?.isPublic ? 'Public' : 'Private'`}
          >
            {isPublic ? "Public" : "Private"}
          </span>

          <span class="segment-duration">{formatedDuration}</span>
        </div>
      </div>

      <div class="title-text">
        <span data-bind-text={`review.tracks[${index}]?.title || '${title}'`}>
          {title}
        </span>
      </div>
    </div>
  );
};
