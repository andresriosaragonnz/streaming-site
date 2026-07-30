import { loadComponent } from "../../../utils/component.js";
import {
  LayoutProps,
  PlayerProps,
  SegmentCardProps,
  StudioProps,
} from "../../types.js";
const Menu = loadComponent("/components/Menu.html");
const Layout = loadComponent<LayoutProps>(
  "/public/templates/PublicPlayerLayout.html",
);
const ViewStudio = loadComponent<StudioProps>(
  "/public/templates/PublicViewStudio.html",
);
const ViewPlayer = loadComponent<PlayerProps>(
  "/public/templates/PublicViewPlayer.html",
);
const ViewSidebar = loadComponent<object>(
  "/public/templates/PublicViewSidebar.html",
);
const SegmentCard = loadComponent<SegmentCardProps>(
  "/public/templates/PublicSegmentCard.html",
);
const ControlSection = loadComponent(
  "/public/templates/PublicPlayerControls.html",
);

export const compilePublicPerformance = (performance: any): string => {
  const { formattedArtist, venueName, eventDate, segments, formattedDate } =
    performance;
  const cleanVenue = venueName.replaceAll("_", " ");

  const displayTitle = `${formattedArtist} - ${cleanVenue} - ${formattedDate}`;
  const formattedJson = JSON.stringify(segments);
  const ControlSectionHtml = ControlSection({});
  const menuHtml = Menu({});
  const playerHtml = ViewPlayer({
    studioTitle: displayTitle,
    controls: ControlSectionHtml,
    menu: menuHtml,
  });
  const cardsHtml = segments.map(SegmentCard).join("");
  const sidebarHtml = ViewSidebar({ cards: cardsHtml });
  const dynamicStudioHtml = ViewStudio({
    jsonSegments: formattedJson,
    playerPanel: playerHtml,
    sidebarPanel: sidebarHtml,
  });
  const htmlContent = Layout({
    pageTitle: displayTitle,
    bodyContent: `${dynamicStudioHtml}`,
  });
  return htmlContent;
};
