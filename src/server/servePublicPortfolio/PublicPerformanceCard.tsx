import { CardThumbnail } from "../../components/CardThumbnail";

export interface PublicPerformanceCardProps {
  altImage: string;
  artistName: string;
  cardImage: string;
  eventDate: string;
  formattedDate: string;
  formattedVenueName: string;
  venueName: string;
  segmentToken: string;
}

export const PublicPerformanceCard = ({
  altImage,
  artistName,
  cardImage,
  eventDate,
  formattedDate,
  formattedVenueName,
  venueName,
  segmentToken,
}: PublicPerformanceCardProps) => (
  <a
    href={`${artistName}/${venueName}-${eventDate}`}
    class="card u-link-reset"
    // rel="prefetch"
    data-bg={altImage}
    data-image-token={segmentToken}
  >
    <CardThumbnail
      cardImage={cardImage}
      altText={formattedVenueName}
      segmentToken={segmentToken}
    />

    <div class="card-metadata">
      <h3 class="capitalize-words heading-3">{formattedVenueName}</h3>
    </div>
    <div class="card-metadata">
      <p class="date">{formattedDate}</p>
    </div>
  </a>
);
