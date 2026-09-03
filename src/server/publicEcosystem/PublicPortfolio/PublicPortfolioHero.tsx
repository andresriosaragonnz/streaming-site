import { HeroImage } from "../../../components/HeroImage";

export interface PublicPortfolioHeroProps {
  heroImage: string;
  title: string;
  link: string;
  count: number | string;
}

export const PublicPortfolioHero = ({
  heroImage,
  title,
  link,
  count,
}: PublicPortfolioHeroProps) => (
  <div class="artist-hero">
    <HeroImage heroImage={heroImage} />
    <div class="hero-overlay">
      <h1 class="capitalize-words">{title}</h1>
      <button
        type="button"
        class="btn-back"
        data-action="toggle-drawer"
        data-drawer-id="graph-drawer-container"
        style="cursor: pointer;"
      >
        See network
      </button>
      <p class="performance-count">{count} Documented</p>
      <div id="performance-link" data-artist={link}></div>
    </div>
  </div>
);
