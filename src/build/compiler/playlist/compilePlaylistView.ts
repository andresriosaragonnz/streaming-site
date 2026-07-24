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
  "/playlist/templates/PlaylistPlayerLayout.html",
);
const SegmentCard = loadComponent<SegmentCardProps>(
  "/public/templates/PublicSegmentCard.html",
);
const ViewPlayer = loadComponent<PlayerProps>(
  "/playlist/templates/PlaylistViewPlayer.html",
);
const ViewSidebar = loadComponent<object>(
  "/public/templates/PublicViewSidebar.html",
);
const ViewStudio = loadComponent<StudioProps>(
  "/public/templates/PublicViewStudio.html",
);

export function compilePlaylistView(segments: any): void {
  const outputDir = join(process.cwd(), "public/playlist");
  mkdirSync(outputDir, { recursive: true });
  const formattedJson = JSON.stringify(
    segments.map((segment) => ({
      ...segment,
      source: `https://pub-fef6bcaae286450e98785a845f724ff1.r2.dev/${segment.id}/output.m3u8`,
      sourceMp3: `https://pub-fef6bcaae286450e98785a845f724ff1.r2.dev/mp3/${segment.id}.mp3`,
      playerImage: `/screenshots/hero/${segment.id}.jpg`,
      pageTitle: `${segment.artistName} ${segment.title}`,
      pageTitleLink: `/artists/${segment.artistName}/${segment.venueName}-${segment.eventDate}`,
    })),
  );

  const ControlSectionHtml = ControlSection({});
  const playerHtml = ViewPlayer({
    studioTitle: "playlist",
    controls: ControlSectionHtml,
  });
  const cardsHtml = segments
    .map((seg, idx) => {
      return SegmentCard({
        image: `/screenshots/card/${seg.id}.jpg`,
        title: seg.title.replaceAll("_", " "),
        duration: `${seg.duration}`,
        artist: seg.artistName,
        venue: seg.venueName,
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
    pageTitle: "playlist",
    bodyContent: dynamicStudioHtml,
  });

  const outputPath = join(outputDir, `index.html`);
  writeFileSync(outputPath, htmlContent, "utf8");
}
