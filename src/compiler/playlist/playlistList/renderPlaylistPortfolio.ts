import { renderComponent } from "../../renderPage.js";
import { getCardImage } from "../../formatSegments/getCardImage.js";
import { getHeroImage } from "../../formatSegments/getHeroImage.js";
import compiledTemplates from "../../../../templateCache.json" with { type: "json" };
import { templateCache } from "../../../../templateCache";
import { CLOUDFLARE_SOURCE } from "../../formatSegments/constants.js";
import { getRandomIndex } from "../../utils/getRandomIndex.js";

import { createRenderer } from "../../templateRendererFactory.js";

export const renderPlaylistPortfolio = (
  ids: string[],
  names: string[],
  ls: string[],
): string => {
  let count = 0;
  const renderPortfolio = createRenderer(templateCache.MyPlaylists);
  const portfolioHtml = renderPortfolio({
    studioTitle: `${names}`,
    jsonSegments: JSON.stringify(ids),
    cards: "",
    title: "My Playlists",
    count,
    CLOUDFLARE_SOURCE,
    pageTitle: `My Playlists`,
    heroImages: JSON.stringify(flattedImagesArray),
    heroImage: portfolioImages[getRandomIndex(portfolioImages)],
  });
  const portfolioImages = [] as string[];
  const cards = names
    .map((name: any, index: number) => {
      count += parseInt(ls[index]);
      const heroImage = getHeroImage(ids[index]);
      portfolioImages.push(heroImage);
      return renderComponent(compiledTemplates.PlaylistPerformanceCard, {
        playlistName: name,
        cardImage: getCardImage(ids[index]),
        altImage: heroImage,
        playlistLength: ls[index],
      });
    })
    .join("");
  const flattedImagesArray = portfolioImages.flat();
  const htmlContent = renderComponent(compiledTemplates.MyPlaylists, {
    studioTitle: `${names}`,
    jsonSegments: JSON.stringify(ids),
    cards,
    title: "My Playlists",
    count,
    CLOUDFLARE_SOURCE,
    pageTitle: `My Playlists`,
    heroImages: JSON.stringify(flattedImagesArray),
    heroImage: portfolioImages[getRandomIndex(portfolioImages)],
  });
  return htmlContent;
};
