import { renderComponent } from "../../renderPage.js";
import compiledTemplates from "../../../../templateCache.json" with { type: "json" };
import { getRandomIndex } from "../../utils/getRandomIndex.js";
import { CLOUDFLARE_SOURCE } from "../../formatSegments/constants.js";

const getRandomElements = (arr: any[], n: number) => {
  const safeN = n < arr.length ? n : arr.length;
  return [...arr].sort(() => 0.5 - Math.random()).slice(0, safeN);
};

export const renderPublicPortfolio = (
  performances: any,
  formatedSegments: any,
): string => {
  const portfolioImages = [] as string[][];
  const { formattedArtist, artistId } = formatedSegments[0];
  if (performances.public.length === 0) {
    return renderComponent(compiledTemplates.Missing, {});
  }

  const gridHtml = performances.public
    .map((performance: any) => {
      const random = getRandomElements(performance.images, 8);
      portfolioImages.push(random);
      return renderComponent(
        compiledTemplates.PublicPerformanceCard,
        performance,
      );
    })
    .join("");

  const flattedImagesArray = portfolioImages.flat();
  const htmlContent = renderComponent(compiledTemplates.PublicPortfolio, {
    title: `${formattedArtist}`,
    link: artistId,
    count: performances.private.length,
    gridHtml,
    CLOUDFLARE_SOURCE,
    pageTitle: `${formattedArtist}`,
    heroImages: JSON.stringify(flattedImagesArray),
    heroImage: formatedSegments[getRandomIndex(formatedSegments)].heroImage,
  });

  return htmlContent;
};
