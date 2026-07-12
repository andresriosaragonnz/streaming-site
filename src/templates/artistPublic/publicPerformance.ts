import { loadComponent } from "../../utils/component.js";
import { dateFromString } from "../../utils/formatDates.js";
import {
  LayoutProps,
  PlayerProps,
  PrivateRenderData,
  SegmentCardProps,
  StudioProps,
} from "../types.js";

const Layout = loadComponent<LayoutProps>("PlayerLayout.html");
const ViewStudio = loadComponent<StudioProps>("ViewStudio.html");
const ViewPlayer = loadComponent<PlayerProps>("PublicViewPlayer.html");
const ViewSidebar = loadComponent<object>("PublicViewSidebar.html");
const SegmentCard = loadComponent<SegmentCardProps>("PublicSegmentCard.html");
const ControlSection = loadComponent("PublicPlayerControls.html");

export const renderPublicPerformance = (data: PrivateRenderData): string => {
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
        duration: seg.duration,
        artist: data.artistName,
        venue: data.venueName,
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
