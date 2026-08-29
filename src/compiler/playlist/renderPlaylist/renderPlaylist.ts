import { renderComponent } from "../../renderPage.js";
import compiledTemplates from "../../../../templateCache.json" with { type: "json" };

export const renderPlaylist = (performance: any, nameParam: string): string => {
  const { segments } = performance;
  const cards = segments
    .map((segment: any, index: number) =>
      renderComponent(compiledTemplates.PlaylistSegmentCard, {
        ...segment,
        index,
      }),
    )
    .join("");
  const htmlContent = renderComponent(compiledTemplates.Playlist, {
    studioTitle: `${nameParam}`,
    jsonSegments: JSON.stringify(segments),
    cardImage: `${segments[0].cardImage}`,
    firstMp3: `${segments[0].sourceMp3}`,
    firstTitle: segments[0].formattedTitle,
    artistName: segments[0].formattedArtist,
    cards,
  });
  return htmlContent;
};
