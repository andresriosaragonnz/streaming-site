import { loadComponent } from "../utils/component.js";
import { dateFromString } from "../utils/formatDates.js";

interface LayoutProps {
  pageTitle: string;
  bodyContent: string;
  extraScripts?: string;
}

interface PlayerProps {
  studioTitle: string;
}

interface StudioProps {
  jsonSegments: string;
  playerPanel: string;
  sidebarPanel: string;
}

interface RenderSegment {
  id: string;
  title: string;
  cardImage: string;
  heroImage: string;
  status: "public" | "private";
}

interface PrivateRenderData {
  artistName: string;
  venueName: string;
  eventDate: string;
  heroImage: string;
  segments: RenderSegment[];
}

const Layout = loadComponent<LayoutProps>("BaseLayout.html");
const ReviewStudio = loadComponent<StudioProps>("ReviewStudio.html");
const ReviewPlayer = loadComponent<PlayerProps>("ReviewPlayer.html");
const ReviewSidebar = loadComponent<object>("ReviewSidebar.html");

export function render(data: PrivateRenderData): string {
  const cleanVenue = data.venueName.replaceAll("_", " ");
  const cleanDate = dateFromString(data.eventDate);
  const displayTitle = `${cleanVenue} - ${cleanDate.formated}`;

  // Simply serialize the raw collection array directly without regex mutations
  const formattedJson = JSON.stringify(data.segments);

  const playerHtml = ReviewPlayer({ studioTitle: displayTitle });

  const sidebarHtml = ReviewSidebar({});

  // Compose all components cleanly
  const dynamicStudioHtml = ReviewStudio({
    jsonSegments: formattedJson,
    playerPanel: playerHtml,
    sidebarPanel: sidebarHtml,
  });

  return Layout({
    pageTitle: displayTitle,
    bodyContent: dynamicStudioHtml,
    extraScripts: `
    <link rel="stylesheet" href="/css/review-studio.css">
      <script type="module" src="/js/app.js"></script>
    `,
  });
}
