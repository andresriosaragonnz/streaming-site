import { HeroImage } from "../../components/HeroImage";

export interface PlaylistHeroProps {
  heroImage: string;
  segmentToken?: string;
  count: number | string;
}
export const PlaylistHero = ({
  heroImage,
  segmentToken,
  count,
}: PlaylistHeroProps) => (
  <div class="artist-hero">
    <HeroImage heroImage={heroImage} segmentToken={segmentToken} />

    <div class="hero-overlay">
      <h1 class="capitalize-words">My Playlists</h1>
      <p class="performance-count">{count} Documented</p>
    </div>
  </div>
);
