import {
  renderPlaylist,
  renderPlaylistSegmentCard,
} from "../../../../templateCache";

export const renderPlaylistPage = (
  performance: any,
  nameParam: string,
): string => {
  const { segments } = performance;
  const cards = segments
    .map((segment: any, index: number) =>
      renderPlaylistSegmentCard({
        ...segment,
        index,
      }),
    )
    .join("");
  const htmlContent = renderPlaylist({
    pageTitle: `${nameParam}`,
    jsonSegments: JSON.stringify(segments),
    cardImage: `${segments[0].cardImage}`,
    firstMp3: `${segments[0].sourceMp3}`,
    firstTitle: segments[0].formattedTitle,
    artistName: segments[0].formattedArtist,
    artistLink: segments[0].formattedArtist,
    cards,
  });
  return htmlContent;
};
