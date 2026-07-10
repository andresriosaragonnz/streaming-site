import { loadComponent } from "../utils/component.js";

interface LayoutProps {
  pageTitle: string;
  bodyContent: string;
}

interface HeroProps {
  bgImage: string;
  title: string;
  count: number;
}

interface IndexCardProps {
  slug: string;
  image: string;
  name: string;
  countText: string;
}

interface Performance {
  ID: number;
  ImageURL?: string;
  VenueName?: string;
  EventDate?: string;
}

interface ArtistProfile {
  name: string;
  photo?: string;
  performances: Performance[];
}

// Map the string keys of the master catalog block passed from your compiler
type ArtistCatalog = Record<string, ArtistProfile>;

// Initialize the shared template layout ecosystem
const Layout = loadComponent<LayoutProps>("BaseLayout.html");
const Hero = loadComponent<HeroProps>("Hero.html");
const IndexCard = loadComponent<IndexCardProps>("IndexCard.html");

export function render(artists: ArtistCatalog): string {
  const totalArtists = Object.keys(artists).length;

  // 1. Build out the cards for each artist profile block dynamically
  const gridHtml = Object.keys(artists)
    .map((slug) => {
      const artist = artists[slug];
      const totalPerformances = artist.performances
        ? artist.performances.length
        : 0;
      const cardImage = artist.photo || "";

      const countText = `${totalPerformances} ${totalPerformances === 1 ? "Performance" : "Performances"}`;

      return IndexCard({
        slug,
        image: cardImage,
        name: artist.name.replaceAll("_", " "),
        countText: countText,
      });
    })
    .join("");

  // 2. Generate unified hero section using your existing template keys
  const heroHtml = Hero({
    bgImage: "/index.jpg",
    title: "live archive",
    count: totalArtists, // Interchanges naturally with your schema counts!
  });

  // 3. Thread the page assets seamlessly through the layout framework
  return Layout({
    pageTitle: "All Artists",
    bodyContent: `
      ${heroHtml}
      
      <main class="performance-grid">
        ${gridHtml}
      </main>

      <script src="/js/prefetch.js" defer></script>
    `,
  });
}
