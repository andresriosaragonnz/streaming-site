import { HeroImage } from "../../components/HeroImage";

export interface FeedHeroProps {
  heroImage: any;
}
export const FeedHero = ({ heroImage }: FeedHeroProps) => (
  <div class="artist-hero">
    <HeroImage heroImage={heroImage} />

    <div class="hero-overlay">
      <h1 class="capitalize-words">My Updates</h1>
      <p class="performance-count">
        <span x-text="Object.keys($store.follows.getFeed()).length">0</span>{" "}
        Upldates
      </p>
    </div>
  </div>
);
