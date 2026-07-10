import { loadComponent } from "../utils/component.js";

interface HeroProps {
  bgImage: string;
  title: string;
  count: number;
}

interface SegmentCardProps {
  image: string;
  title: string;
}

interface LayoutProps {
  pageTitle: string;
  bodyContent: string;
  extraScripts?: string;
}

interface RenderSegment {
  id: string;
  title: string;
  cardImage: string;
}

interface PerformanceRenderData {
  artistName: string;
  venueName: string;
  eventDate: string;
  heroImage: string;
  segments: RenderSegment[];
}

// Load template fragments cleanly from disk
const Layout = loadComponent<LayoutProps>("BaseLayout.html");
const Hero = loadComponent<HeroProps>("Hero.html");
const SegmentCard = loadComponent<SegmentCardProps>("SegmentCard.html");

export function render(data: PerformanceRenderData): string {
  // Construct a readable title for the performance banner
  const cleanArtist = data.artistName.replaceAll("_", " ");
  const cleanVenue = data.venueName.replaceAll("_", " ");
  const displayTitle = `${cleanArtist} @ ${cleanVenue}`;

  // Build the grid mapping strictly public track segments
  const gridHtml = data.segments
    .map((seg) => {
      return SegmentCard({
        image: seg.cardImage,
        title: seg.title.replaceAll("_", " "),
      });
    })
    .join("");

  const heroHtml = Hero({
    bgImage: data.heroImage,
    title: displayTitle,
    count: data.segments.length, // Shows count of public chapters documented
  });

  return Layout({
    pageTitle: displayTitle,
    bodyContent: `
      ${heroHtml}
      <main class="performance-grid">
        ${gridHtml}
      </main>
    `,
    extraScripts: ``,
  });
}
