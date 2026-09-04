export interface ItemThumbnailProps {
  cardImage: string;
  title: string;
}

export const ItemThumbnail = ({ cardImage, title }: ItemThumbnailProps) => (
  <picture class="item-thumbnail">
    <source srcset={`${cardImage}.avif`} type="image/avif" />
    <source srcset={`${cardImage}.webp`} type="image/webp" />
    <img
      src={`${cardImage}.jpg`}
      alt={title}
      loading="eager"
      style="width: 100%; height: 100%; object-fit: cover; display: block"
    />
  </picture>
);
