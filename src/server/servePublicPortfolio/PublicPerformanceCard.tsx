import { ItemThumbnail } from "../../components/ItemThumbnail";

export interface PublicPerformanceCardProps {
  altImage: string;
  artistName: string;
  cardImage: string;
  eventDate: string;
  formattedDate: string;
  formattedVenueName: string;
  venueName: string;
}

export const PublicPerformanceCard = ({
  altImage,
  artistName,
  cardImage,
  eventDate,
  formattedDate,
  formattedVenueName,
  venueName,
}: PublicPerformanceCardProps) => (
  <a
    href={`${artistName}/${venueName}-${eventDate}`}
    class="card"
    rel="prefetch"
    data-bg={altImage}
    style="text-decoration: none; color: inherit"
  >
    <ItemThumbnail cardImage={cardImage} title={formattedVenueName} />

    <div class="card-metadata">
      <h3 class="capitalize-words h3">{formattedVenueName}</h3>
    </div>
    <div class="card-metadata">
      <p class="date">{formattedDate}</p>
    </div>
  </a>
);
