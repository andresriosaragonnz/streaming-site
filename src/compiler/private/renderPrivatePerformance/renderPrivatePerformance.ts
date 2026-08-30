import { formatSegments } from "../../formatSegments/index.js";
import {
  renderPrivatePerformance,
  renderPrivateSegmentCard,
} from "../../../../templateCache";

export const renderPrivatePerformancePage = (segments: any): string => {
  const { formattedSegments } = formatSegments(segments);

  const { formattedArtist, venueName, formattedDate } = formattedSegments[0];
  const cards = formattedSegments
    .map((segment) => renderPrivateSegmentCard(segment))
    .join("");
  const cleanVenue = venueName.replaceAll("_", " ");
  const htmlContent = renderPrivatePerformance({
    studioTitle: `${formattedArtist}-${cleanVenue}-${formattedDate}`,
    jsonSegments: JSON.stringify(formattedSegments),
    posterImage: `${formattedSegments[0].cardImage}`,
    cards,
  });
  return htmlContent;
};
