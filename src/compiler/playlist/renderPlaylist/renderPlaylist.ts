import { renderComponent } from "../../renderPage.js";
import compiledTemplates from "../../../../templateCache.json" with { type: "json" };

export const renderPlaylist = (performance: any): string => {
  const { segments } = performance;

  const { formattedArtist, venueName, formattedDate } = segments[0];
  const cards = segments
    .map((segment: any) =>
      renderComponent(compiledTemplates.PlaylistSegmentCard, segment),
    )
    .join("");
  const cleanVenue = venueName.replaceAll("_", " ");
  const htmlContent = renderComponent(compiledTemplates.Playlist, {
    studioTitle: `${formattedArtist}-${cleanVenue}-${formattedDate}`,
    jsonSegments: JSON.stringify(segments),
    cards,
  });
  return htmlContent;
};
