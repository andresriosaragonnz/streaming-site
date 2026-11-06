import { HeroImage } from "../../components/HeroImage";

export interface ClaimHeroProps {
  heroImage: string;
  segmentToken?: string;
  title: string;
  link: string;
  count: number | string;
  totalDuration: string;
}

export const ClaimHero = ({
  heroImage,
  segmentToken,
  title,
  link,
  count,
  totalDuration,
}: ClaimHeroProps) => (
  <div class="artist-hero">
    <HeroImage heroImage={heroImage} segmentToken={segmentToken} />
    {/* 3. Foreground Content Overlay */}
    <div class="hero-overlay">
      <h1 class="capitalize-words">{title}</h1>
      <h3>You are authorized in this machine</h3>
      <a href={`/${link}`} class="btn-back">
        See public profile
      </a>
      <p class="performance-count">{count} Documented</p>
      <p class="performance-count">{totalDuration}</p>
      <div id="performance-link" data-artist={link}></div>
    </div>
  </div>
);
