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
      class="card u-link-reset"
      data-bg={altImage}
    >
      <picture class="card-thumbnail">
        <source srcset={`${cardImage}.avif`} type="image/avif" />
        <source srcset={`${cardImage}.webp`} type="image/webp" />
        <img
          class="u-cover"
          src={`${cardImage}/card.jpg`}
          alt={`${formattedVenueName} - ${formattedDate}`}
          loading="lazy"

        />
      </picture>

      <div class="card-metadata">
        <h3 class="capitalize-words heading-3">{formattedVenueName}</h3>
        <p class="date">{formattedDate}</p>
      </div>
    </a>
  );
}
