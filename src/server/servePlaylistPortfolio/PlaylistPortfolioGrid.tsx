import { PlaylistCard } from "./PlaylistCard";
import { PlaylistHero } from "./PlaylistHero";
import { getCardImage } from "../../formatSegments/getCardImage";
import { getHeroImage } from "../../formatSegments/getHeroImage";
import { getRandomIndex } from "../../formatSegments/utils/getRandomIndex";

export interface PlaylistPortfolioGridProps {
  ids: string[];
  names: string[];
  ls: string[];
}

export interface PortfolioRenderResult {
  cardsHTML: string;
  heroHTML: string;
  count: number;
}

export const renderPortfolioGrid = ({
  ids,
  names,
  ls,
}: PlaylistPortfolioGridProps): PortfolioRenderResult => {
  if (!ids || ids.length === 0) {
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

  const portfolioImages: string[] = [];
  let totalTracks = 0;

  const cards = ids.map((id, index) => {
    const cardImage = getCardImage(id);
    const trackCount = parseInt(ls[index] || "0", 10);
    totalTracks += trackCount;

    const heroImg = getHeroImage(id);
    if (heroImg) portfolioImages.push(heroImg);

    return (
      <PlaylistCard
        playlistName={names[index] || id}
        playlistLength={ls[index] || "0"}
        altImage={cardImage}
        cardImage={cardImage}
      />
    );
  });

  const selectedHeroImage =
    portfolioImages.length > 0
      ? portfolioImages[getRandomIndex(portfolioImages)]
      : "/images/default-hero.jpg";

  const hero = (
    <PlaylistHero heroImage={selectedHeroImage} count={ids.length} />
  );

  return {
    cardsHTML: cards.join(""),
    heroHTML: String(hero),
    count: totalTracks,
  };
};
