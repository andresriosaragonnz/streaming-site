import { HeroImage } from "../../components/HeroImage";

export interface PrivateDashboardHeroProps {
  heroImage: string;
  segmentToken?: string;
  title: string;
  link: string;
  count: number | string;
  totalDuration: string;
}

export const PrivateDashboardHero = ({
  heroImage,
  segmentToken,
  title,
  link,
  count,
  totalDuration,
}: PrivateDashboardHeroProps) => (
  <div class="artist-hero">
    <HeroImage heroImage={heroImage} segmentToken={segmentToken} />
    {/* 3. Foreground Content Overlay */}
    <div class="hero-overlay">
      <h1 class="capitalize-words">{title}</h1>

      <a href={`/${link}?t=${Date.now()}`} class="btn-back">
        See public profile
      </a>
      <p class="performance-count">{count} Documented</p>
      <p class="performance-count">{totalDuration}</p>
      <div id="performance-link" data-artist={link}></div>
    </div>
  </div>
);
