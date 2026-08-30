import { ItemThumbnail } from "../../components/ItemThumbnail";

export interface FeedCard {
  link: string;
  cardImage: string;
  artistName: string;
  count: string;
}

export const FeedCard = ({ link, cardImage, artistName, count }: FeedCard) => (
  <a
    href={`/${link}`}
    class="card"
    style="text-decoration: none; color: inherit"
  >
    <ItemThumbnail cardImage={cardImage} title={artistName} />

    <div class="card-metadata">
      <h3 class="capitalize-words h3">{artistName}</h3>
    </div>
    <div class="card-metadata">
      <p class="date">{count} new</p>
    </div>
  </a>
);
