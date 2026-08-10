import { renderComponent } from "../../renderPage.js";
import compiledTemplates from "../../../../templateCache.json" with { type: "json" };

export const renderPublicPerformance = (performance: any): string => {
  const { segments } = performance;

  const { formattedArtist, venueName, formattedDate } = segments[0];
  const cards = segments
    .map((segment: any) =>
      renderComponent(compiledTemplates.PublicSegmentCard, segment),
    )
    .join("");
  const cleanVenue = venueName.replaceAll("_", " ");
  const htmlContent = renderComponent(compiledTemplates.PublicPerformance, {
    studioTitle: `${formattedArtist}-${cleanVenue}-${formattedDate}`.replace(
      / /g,
      "\u00A0",
    ),
    jsonSegments: JSON.stringify(segments),
    cards,
  });
  return htmlContent;
};
