import { writeFileSync, mkdirSync } from "fs";
import { join } from "path";
import { loadComponent } from "../../../utils/component.js";
import { dateFromString } from "../../../utils/formatDates.js";
import {
  LayoutProps,
  PlayerProps,
  SegmentCardProps,
  StudioProps,
  Performance,
} from "../../types.js";
const Menu = loadComponent("Menu.html");
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

export const compilePublicPerformances = (
  artistSegments: any,
  performances: any,
): void => {
  for (const performance of performances) {
    const { artistName, venueName, eventDate, segments } = performance;
    const outputDir = join(
      process.cwd(),
      "public/artists",
      artistName,
      `${venueName}-${eventDate}`,
    );
    mkdirSync(outputDir, { recursive: true });

    const cleanVenue = venueName.replaceAll("_", " ");
    const cleanDate = dateFromString(eventDate);

    const displayTitle = `${cleanVenue} - ${cleanDate.formated}`;
    const formattedJson = JSON.stringify(artistSegments);
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
    const outputPath = join(outputDir, `index.html`);
    writeFileSync(outputPath, htmlContent, "utf8");
  }

  return;
  const { venueName, eventDate, segments, id } = performance;

  // Simply serialize the raw collection array directly without regex mutations
  const formattedJson = JSON.stringify(
    segments.map((segment) => ({
      ...segments,
      source: `https://pub-fef6bcaae286450e98785a845f724ff1.r2.dev/${segment.id}/output.m3u8`,
    })),
  );

  const sidebarHtml = ViewSidebar({ cards: cardsHtml });

  // Compose all components cleanly
};
