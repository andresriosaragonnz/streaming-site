import { loadComponent } from "../../../utils/component.js";
import {
  LayoutProps,
  PlayerProps,
  SegmentCardProps,
  StudioProps,
} from "../../types.js";
const Menu = loadComponent("/components/Menu.html");
const Modal = loadComponent("/private/templates/CommitModal.html");
const Layout = loadComponent<LayoutProps>(
  "/private/templates/PrivateStudioLayout.html",
);
const ViewStudio = loadComponent<StudioProps>(
  "/private/templates/PrivateViewStudio.html",
);
const ViewPlayer = loadComponent<PlayerProps>(
  "/private/templates/PrivateViewPlayer.html",
);
const ViewSidebar = loadComponent<object>(
  "/private/templates/PrivateViewSidebar.html",
);
const SegmentCard = loadComponent<SegmentCardProps>(
  "/private/templates/PrivateSegmentCard.html",
);
const ControlSection = loadComponent(
  "/private/templates/PrivatePlayerControls.html",
);

export const compilePrivatePerformance = (performance: any): string => {
  const { formattedArtist, venueName, eventDate, segments, formattedDate } =
    performance;

  const cleanVenue = venueName.replaceAll("_", " ");

  const displayTitle = `${formattedArtist} - ${cleanVenue} - ${formattedDate}`;
  const formattedJson = JSON.stringify(segments);
  const CommitModalHtml = Modal({});
  const ControlSectionHtml = ControlSection({ modal: CommitModalHtml });
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
