import { renderComponent } from "../../renderPage.js";
import compiledTemplates from "../../../../templateCache.json" with { type: "json" };
import { CLOUDFLARE_SOURCE } from "../../formatSegments/constants.js";

export const renderPublicPerformance = (performance: any): string => {
  const { segments } = performance;

  const { formattedArtist, venueName, formattedDate } = segments[0];
  const cards = segments
    .map((segment: any, index: number) =>
      renderComponent(compiledTemplates.PublicSegmentCard, {
        ...segment,
        index,
      }),
    )
    .join("");
  const cleanVenue = venueName.replaceAll("_", " ");

  const sideBar = renderComponent(compiledTemplates.PublicSideBar, {
    artistName: `${segments[0].formattedArtist}`,
    artistLink: `${segments[0].artistName}`,
    cards,
  });
  const htmlContent = renderComponent(compiledTemplates.PublicPerformance, {
    studioTitle: `${formattedArtist}-${cleanVenue}-${formattedDate}`.replace(
      / /g,
      "\u00A0",
    ),
    jsonSegments: JSON.stringify(segments),
    firstTitle: segments[0].formattedTitle,
    sideBar,
    cardImage: `${segments[0].cardImage}`,
    firstMp3: `${segments[0].sourceMp3}`,
    CLOUDFLARE_SOURCE,
  });
  return htmlContent;
};
