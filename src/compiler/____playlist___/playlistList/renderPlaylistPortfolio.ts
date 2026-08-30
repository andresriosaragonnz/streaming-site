import { getCardImage } from "../../formatSegments/getCardImage.js";
import { getHeroImage } from "../../formatSegments/getHeroImage.js";
import {
  renderMyPlaylists,
  renderPlaylistPerformanceCard,
} from "../../../../templateCache.js";
import { getRandomIndex } from "../../utils/getRandomIndex.js";

export const renderPlaylistPortfolio = (
  ids: string[],
  names: string[],
  ls: string[],
): string => {
  let count = 0;

  const portfolioImages = [] as string[];
  const cards = names
    .map((name: any, index: number) => {
      count += parseInt(ls[index]);
      const heroImage = getHeroImage(ids[index]);
      portfolioImages.push(heroImage);
      const card = renderPlaylistPerformanceCard({
        playlistName: name,
        cardImage: getCardImage(ids[index]),
        altImage: heroImage,
        playlistLength: ls[index],
        altText: `playlist_${name}`,
      });
      return card;
    })
    .join("");
  const htmlContent = renderMyPlaylists({
    cards,
    heroImage: portfolioImages[getRandomIndex(portfolioImages)],
    count,
  });
  return htmlContent;
};
