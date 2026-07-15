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

export const compilePrivatePerformance = (
  artistName: string,
  artistId: string,
  performance: Performance,
): void => {
  const { venueName, eventDate, segments, id } = performance;
  const outputDir = join(
    process.cwd(),
    "public/artists",
    artistId,
    "private",
    `${venueName}-${eventDate}`,
  );
  mkdirSync(outputDir, { recursive: true });

  const cleanVenue = venueName.replaceAll("_", " ");
  const cleanDate = dateFromString(eventDate);

  const displayTitle = `${cleanVenue} - ${cleanDate.formated}`;

  // Simply serialize the raw collection array directly without regex mutations
  const formattedJson = JSON.stringify(
    segments.map((segment) => ({
      ...segments,
      source: `https://pub-fef6bcaae286450e98785a845f724ff1.r2.dev/${segment.id}/output.m3u8`,
    })),
  );

  const ControlSectionHtml = ControlSection({});
  const playerHtml = ViewPlayer({
    studioTitle: displayTitle,
    controls: ControlSectionHtml,
  });
  const cardsHtml = segments
    .map((seg, idx) => {
      return SegmentCard({
        image: `/screenshots/card/${artistName}-${venueName}-${eventDate}-card_${idx}.jpg`,
        title: seg.title.replaceAll("_", " "),
        id: id,
        index: seg.index,
      });
    })
    .join("");

  const sidebarHtml = ViewSidebar({ cards: cardsHtml });

  // Compose all components cleanly
  const dynamicStudioHtml = ViewStudio({
    jsonSegments: formattedJson,
    playerPanel: playerHtml,
    sidebarPanel: sidebarHtml,
  });

  const htmlContent = Layout({
    pageTitle: displayTitle,
    bodyContent: dynamicStudioHtml,
  });
  const outputPath = join(outputDir, `index.html`);
  writeFileSync(outputPath, htmlContent, "utf8");
};
