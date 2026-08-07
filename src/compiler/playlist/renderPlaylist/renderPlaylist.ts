import { renderComponent } from "../../renderPage.js";
import compiledTemplates from "../../../../templateCache.json" with { type: "json" };

export const renderPlaylist = (performance: any, nameParam: string): string => {
  const { segments } = performance;

  const cards = segments
    .map((segment: any) =>
      renderComponent(compiledTemplates.PlaylistSegmentCard, segment),
    )
    .join("");
  const htmlContent = renderComponent(compiledTemplates.Playlist, {
    studioTitle: `${nameParam}`,
    jsonSegments: JSON.stringify(segments),
    cards,
  });
  return htmlContent;
};
