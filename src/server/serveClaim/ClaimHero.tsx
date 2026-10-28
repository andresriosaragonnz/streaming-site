import { HeroImage } from "../../components/HeroImage";

export interface ClaimHeroProps {
  heroImage: string;
  title: string;
  link: string;
  count: number | string;
  totalDuration: string;
}

export const ClaimHero = ({
  heroImage,
  title,
  link,
  count,
  totalDuration,
}: ClaimHeroProps) => (
  <div class="artist-hero">
    <HeroImage heroImage={heroImage} />
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
