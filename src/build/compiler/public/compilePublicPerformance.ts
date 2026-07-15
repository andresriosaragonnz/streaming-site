import { writeFileSync, mkdirSync } from "fs";
import { join } from "path";
import { dateFromString } from "../../../utils/formatDates.js";
import { loadComponent } from "../../../utils/component.js";
import {
  LayoutProps,
  PlayerProps,
  SegmentCardProps,
  StudioProps,
  Performance,
} from "../../types.js";

const ControlSection = loadComponent(
  "/public/templates/PublicPlayerControls.html",
);
const Layout = loadComponent<LayoutProps>(
  "/public/templates/PublicPlayerLayout.html",
);
const SegmentCard = loadComponent<SegmentCardProps>(
  "/public/templates/PublicSegmentCard.html",
);
const ViewPlayer = loadComponent<PlayerProps>(
  "/public/templates/PublicViewPlayer.html",
);
const ViewSidebar = loadComponent<object>(
  "/public/templates/PublicViewSidebar.html",
);
const ViewStudio = loadComponent<StudioProps>(
  "/public/templates/PublicViewStudio.html",
);

export function compilePublicPerformance(
  artistId: string,
  performance: Performance,
): void {
  const outputDir = join(
    process.cwd(),
    "public/artists",
    artistId,
    `${performance.venueName}-${performance.eventDate}`,
  );
  mkdirSync(outputDir, { recursive: true });
  const { venueName, eventDate, segments, artistName, id } = performance;

  const cleanVenue = venueName.replaceAll("_", " ");
  const cleanDate = dateFromString(eventDate);
  const displayTitle = `${cleanVenue} - ${cleanDate.formated}`;

  const formattedJson = JSON.stringify(
    segments.map((segment) => ({
      ...segment,
      source: `https://pub-fef6bcaae286450e98785a845f724ff1.r2.dev/${segment.id}/output.m3u8`,
      sourceMp3: `https://pub-fef6bcaae286450e98785a845f724ff1.r2.dev/mp3/${segment.id}.mp3`,
      playerImage: `/screenshots/hero/${id}.jpg`,
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
        image: `/screenshots/card/${id}.jpg`,
        title: seg.title.replaceAll("_", " "),
        duration: `${seg.duration}`,
        artist: artistName,
        venue: venueName,
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
}
