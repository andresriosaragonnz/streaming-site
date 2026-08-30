export const HeroImage = ({ heroImage }: { heroImage: string }) => (
  <>
    <picture class="hero-picture">
      {/* Mobile Portrait (< 640px) */}
      <source
        id="hero-mobile-avif"
        type="image/avif"
        media="(max-width: 639px)"
        srcset={`${heroImage}/mobile.avif`}
      />
      {/* Desktop Master (>= 1024px) */}
      <source
        id="hero-desktop-avif"
        type="image/avif"
        srcset={`${heroImage}/desktop.avif`}
      />

      {/* Legacy Fallback JPG */}
      <img
        id="hero-img"
        src={`${heroImage}/desktop.jpg`}
        alt="My Playlists"
        class="hero-img"
        loading="eager"
      />
    </picture>

    {/* Dedicated Hover Fade Overlay (Outside picture tag) */}
    <img id="hero-img-fade" src="" alt="" class="hero-img-fade" />

    {/* 2. Independent Gradient Overlay for Readability */}
    <div class="hero-gradient-overlay"></div>
  </>
);
