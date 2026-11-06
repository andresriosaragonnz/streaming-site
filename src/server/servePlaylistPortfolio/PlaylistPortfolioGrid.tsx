import { PlaylistCard } from "./PlaylistCard";
import { PlaylistHero } from "./PlaylistHero";
import { getHeroImage } from "../../formatSegments/getHeroImage";
import { getRandomIndex } from "../../formatSegments/utils/getRandomIndex";

export interface PortfolioItem {
  id: string;
  name: string;
  trackCount: number | string;
  cardImage: string;
  heroImage: string;
  segmentToken: string;
}

export interface PlaylistPortfolioGridProps {
  items: PortfolioItem[];
}

export interface PortfolioRenderResult {
  cardsHTML: string;
  heroHTML: string;
  count: number;
}

export const renderPortfolioGrid = ({
  items = [],
}: PlaylistPortfolioGridProps): PortfolioRenderResult => {
  if (items.length === 0) {
    const emptyHero = (
      <PlaylistHero heroImage={getHeroImage("playlists")} count={0} />
    );

    const emptyCards = (
      <div class="portfolio-empty-state">
        <p>You haven't created any custom playlists yet.</p>
      </div>
    );

    return {
      cardsHTML: String(emptyCards),
      heroHTML: String(emptyHero),
      count: 0,
    };
  }

  let totalTracks = 0;

  const cards = items.map((item) => {
    totalTracks += Number(item.trackCount) || 0;

    return (
      <PlaylistCard
        playlistName={item.name}
        playlistLength={item.trackCount}
        altImage={item.heroImage}
        cardImage={item.cardImage}
        segmentToken={item.segmentToken}
      />
    );
  });

  const heroItems = items.filter((item) => item.heroImage);
  const selectedHeroItem = heroItems[getRandomIndex(heroItems)] ?? null;

  const selectedHeroImage = selectedHeroItem?.heroImage
    ? selectedHeroItem.heroImage
    : getHeroImage("playlists");

  const hero = (
    <PlaylistHero
      heroImage={selectedHeroImage}
      segmentToken={selectedHeroItem?.segmentToken}
      count={items.length}
    />
  );

  return {
    cardsHTML: cards.join(""),
    heroHTML: String(hero),
    count: totalTracks,
  };
};
