import { writeFileSync, mkdirSync } from "fs";
import { join } from "path";
import { loadComponent } from "../../../utils/component.js";
import { dateFromString } from "../utils/formatDates.js";
import {
  LayoutProps,
  PlayerProps,
  SegmentCardProps,
  StudioProps,
  Performance,
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

export const compilePrivatePerformances = (performances: any): void => {
  for (const performance of performances) {
    const { artistName, venueName, eventDate, segments } = performance;
    const outputDir = join(
      process.cwd(),
      "public/artists",
      artistName,
      "private",
      `${venueName}-${eventDate}`,
    );
    mkdirSync(outputDir, { recursive: true });

    const cleanVenue = venueName.replaceAll("_", " ");
    const cleanDate = dateFromString(eventDate);

    const displayTitle = `${cleanVenue} - ${cleanDate.formated}`;
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
    const outputPath = join(outputDir, `index.html`);
    writeFileSync(outputPath, htmlContent, "utf8");
  }

  return;
};
