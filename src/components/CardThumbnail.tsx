export interface CardThumbnailProps {
  cardImage: string;
  altText: string;
  segmentToken: string;
}

export function CardThumbnail({
  cardImage,
  altText,
  segmentToken,
}: CardThumbnailProps) {
  return (
    <picture class="card-thumbnail">
      <source
        srcset={`${cardImage}.avif?token=${segmentToken}`}
        type="image/avif"
      />
      <source
        srcset={`${cardImage}.webp?token=${segmentToken}`}
        type="image/webp"
      />
      <img
        class="u-cover"
        src={`${cardImage}.jpg?token=${segmentToken}`}
        alt={altText}
        loading="lazy"

      />
    </picture>
  );
}
