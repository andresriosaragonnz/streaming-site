export interface HeroImageProps {
  heroImage: string;
  segmentToken?: string;
}

const FALLBACK_HERO =
  "https://pub-6f41842aec834d428b77bd4e2fa7531c.r2.dev/desktop_2.jpg";
export const HeroImage = ({ heroImage, segmentToken }: HeroImageProps) => {
  const withToken = (url: string) =>
    segmentToken ? `${url}?token=${encodeURIComponent(segmentToken)}` : url;

  const fallbackHandler = `this.onerror=null; this.closest('picture')?.querySelectorAll('source').forEach(s => s.remove()); this.src='${FALLBACK_HERO}';`;

  return (
    <>
      <picture class="hero-picture">
        {/* Mobile Portrait (< 640px) */}
        <source
          id="hero-mobile-avif"
          type="image/avif"
          media="(max-width: 1000px)"
          srcset={withToken(`${heroImage}/mobile.avif`)}
        />
        {/* Desktop Master (>= 1024px) */}
        <source
          id="hero-desktop-avif"
          type="image/avif"
          srcset={withToken(`${heroImage}/desktop.avif`)}
        />

        {/* Legacy Fallback JPG + Hardcoded Local Fallback */}
        <img
          id="hero-img"
          src={withToken(`${heroImage}/desktop.jpg`)}
          alt="My Playlists"
          class="hero-img"
          loading="eager"
          onerror={fallbackHandler}
        />
      </picture>

      {/* Dedicated Hover Fade Overlay (Outside picture tag) */}
      <img id="hero-img-fade" src="" alt="" class="hero-img-fade" />

      {/* Independent Gradient Overlay for Readability */}
      <div class="hero-gradient-overlay"></div>
    </>
  );
};
