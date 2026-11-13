import { HeroImage } from "../../components/HeroImage";

export interface PublicPortfolioHeroProps {
  heroImage: string;
  segmentToken?: string;
  title: string;
  link: string;
  isAllowed: boolean;
  performance: string;
  count: number | string;
}

export const PublicPortfolioHero = ({
  heroImage,
  segmentToken,
  title,
  link,
  count,
  performance,
  isAllowed,
}: PublicPortfolioHeroProps) => (
  <div class="artist-hero">
    <HeroImage heroImage={heroImage} segmentToken={segmentToken} />
    <div class="hero-overlay">
      <h1 class="capitalize-words">{title}</h1>
      <button
        type="button"
        class="back-link u-pointer"
        data-action="open-graph-modal"
      >
        See network
      </button>
      <p class="performance-count">{count} Documented</p>
      {isAllowed && (
        <div id="performance-link">
          <a href={`/private/${link}`}>Private dashboard</a>
        </div>
      )}
      <div id="artist-name" data-artist={link}></div>
    </div>
  </div>
);
