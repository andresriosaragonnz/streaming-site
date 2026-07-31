import { renderComponent } from "../../../../utils/renderPage.js";
import { formatSegments } from "../../utils/formatSegment.js";
import compiledTemplates from "../../../../../templateCache.json" with { type: "json" };

export const renderPrivatePerformance = (segments: any): string => {
  const formatedSegments = formatSegments(segments);
  const { formattedArtist, venueName, formattedDate } = formatedSegments[0];
  const cards = formatedSegments
    .map((segment) =>
      renderComponent(compiledTemplates.PrivateSegmentCard, segment),
    )
    .join("");
  const cleanVenue = venueName.replaceAll("_", " ");
  const htmlContent = renderComponent(compiledTemplates.PrivatePerformance, {
    studioTitle: `${formattedArtist}-${cleanVenue}-${formattedDate}`,
    jsonSegments: JSON.stringify(formatedSegments),
    cards,
  });
  return htmlContent;
};
