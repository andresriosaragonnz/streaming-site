import { ItemThumbnail } from "../../../components/ItemThumbnail";

export interface PublicPerformanceCardProps {
  link: string;
  altImage: string;
  cardImage: string;
  formattedVenueName: string;
  formattedDate: string;
}

export const PublicPerformanceCard = ({
  link,
  altImage,
  cardImage,
  formattedVenueName,
  formattedDate,
}: PublicPerformanceCardProps) => (
  <a
    href={`/${link}`}
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
