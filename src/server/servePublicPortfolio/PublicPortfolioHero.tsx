import { HeroImage } from "../../components/HeroImage";

export interface PublicPortfolioHeroProps {
  heroImage: string;
  title: string;
  link: string;
  isAllowed: string;
  performance: string;
  count: number | string;
}

export const PublicPortfolioHero = ({
  heroImage,
  title,
  link,
  count,
  performance,
  isAllowed,
}: PublicPortfolioHeroProps) => (
  <div class="artist-hero">
    <HeroImage heroImage={heroImage} />
    <div class="hero-overlay">
      <h1 class="capitalize-words">{title}</h1>
      <button
        type="button"
        class="btn-back"
        data-action="open-graph-modal"
        style="cursor: pointer;"
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
