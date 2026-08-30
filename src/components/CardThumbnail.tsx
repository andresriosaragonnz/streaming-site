export interface CardThumbnailProps {
  cardImage: string;
  altText: string;
}

export function CardThumbnail({ cardImage, altText }: CardThumbnailProps) {
  return (
    <picture class="card-thumbnail">
      <source srcset={`${cardImage}.avif`} type="image/avif" />
      <source srcset={`${cardImage}.webp`} type="image/webp" />
      <img
        src={`${cardImage}.jpg`}
        alt={altText}
        loading="lazy"
        style="width: 100%; height: 100%; object-fit: cover; display: block"
      />
    </picture>
  );
}
