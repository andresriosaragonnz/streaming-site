import { loadComponent } from "../../utils/component.js";
import { dateFromString } from "../../utils/formatDates.js";
import {
  LayoutProps,
  PlayerProps,
  PrivateRenderData,
  SegmentCardProps,
  StudioProps,
} from "../types.js";

const Layout = loadComponent<LayoutProps>("StudioLayout.html");
const ViewStudio = loadComponent<StudioProps>("ViewStudio.html");
const ViewPlayer = loadComponent<PlayerProps>("PrivateViewPlayer.html");
const ViewSidebar = loadComponent<object>("PrivateViewSidebar.html");
const SegmentCard = loadComponent<SegmentCardProps>("PrivateSegmentCard.html");
const ControlSection = loadComponent("PrivatePlayerControls.html");

export const renderPrivatePerformance = (data: PrivateRenderData): string => {
  const cleanVenue = data.venueName.replaceAll("_", " ");
  const cleanDate = dateFromString(data.eventDate);

  const displayTitle = `${cleanVenue} - ${cleanDate.formated}`;

  // Simply serialize the raw collection array directly without regex mutations
  const formattedJson = JSON.stringify(data.segments);

  const ControlSectionHtml = ControlSection({});
  const playerHtml = ViewPlayer({
    studioTitle: displayTitle,
    controls: ControlSectionHtml,
  });
  const cardsHtml = data.segments
    .map((seg, idx) => {
      return SegmentCard({
        image: `/screenshots/card/${data.artistName}-${data.venueName}-${data.eventDate}-card_${idx}.jpg`,
        title: seg.title.replaceAll("_", " "),
        performance: data.performance,
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

  return Layout({
    pageTitle: displayTitle,
    bodyContent: dynamicStudioHtml,
  });
};
