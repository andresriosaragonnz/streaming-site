import { ItemThumbnail } from "../../components/ItemThumbnail";

export interface PrivatePerformanceCardProps {
  link: string;
  cardImage: string;
  formattedVenueName: string;
  formattedDate: string;
  duration: string;
  publicSegments: number | string;
  privateSegments: number | string;
}

export const PrivatePerformanceCard = ({
  link,
  cardImage,
  formattedVenueName,
  formattedDate,
  duration,
  publicSegments,
  privateSegments,
}: PrivatePerformanceCardProps) => (
  <a
    href={`/private/performance/${link}`}
    class="card"
    style="text-decoration: none; color: inherit"
  >
    <ItemThumbnail cardImage={cardImage} title={formattedVenueName} />

    <div class="card-metadata">
      <div>
        <h3 class="capitalize-words">{formattedVenueName}</h3>
        <p class="date">{formattedDate}</p>
        <h3>{duration}</h3>
      </div>
      <div>
        <h3>Public:{publicSegments}</h3>
        <h3>Private:{privateSegments}</h3>
      </div>
    </div>
  </a>
);
