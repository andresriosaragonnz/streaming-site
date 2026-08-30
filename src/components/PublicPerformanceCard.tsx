export interface PublicPerformanceCardProps {
  link: string;
  altImage: string;
  cardImage: string;
  formattedVenueName: string;
  formattedDate: string;
}

export function PublicPerformanceCard({
  link,
  altImage,
  cardImage,
  formattedVenueName,
  formattedDate,
}: PublicPerformanceCardProps) {
  return (
    <a
      href={`/${link}`}
      class="card"
      data-bg={altImage}
      style="text-decoration: none; color: inherit"
    >
      <picture class="card-thumbnail">
        <source srcset={`${cardImage}.avif`} type="image/avif" />
        <source srcset={`${cardImage}.webp`} type="image/webp" />
        <img
          src={`${cardImage}/card.jpg`}
          alt={`${formattedVenueName} - ${formattedDate}`}
          loading="lazy"
          style="width: 100%; height: 100%; object-fit: cover; display: block"
        />
      </picture>

      <div class="card-metadata">
        <h3 class="capitalize-words h3">{formattedVenueName}</h3>
        <p class="date">{formattedDate}</p>
      </div>
    </a>
  );
}
