export interface ItemThumbnailProps {
  cardImage: string;
  title: string;
  segmentToken?: string;
}

export const ItemThumbnail = ({
  cardImage,
  title,
  segmentToken,
}: ItemThumbnailProps) => {
  const tokenQuery = segmentToken
    ? `?token=${encodeURIComponent(segmentToken)}`
    : "";

  return (
    <picture class="item-thumbnail">
      <source
        srcset={`${cardImage}.avif${tokenQuery}`}
        type="image/avif"
      />
      <source
        srcset={`${cardImage}.webp${tokenQuery}`}
        type="image/webp"
      />
      <img
        src={`${cardImage}.jpg${tokenQuery}`}
        alt={title}
        loading="lazy"
        decoding="async"
        style="width: 100%; height: 100%; object-fit: cover; display: block"
      />
    </picture>
  );
};
