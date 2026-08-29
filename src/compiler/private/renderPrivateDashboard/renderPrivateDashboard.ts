import { renderComponent } from "../../renderPage.js";
import { formatSegments } from "../../formatSegments/index.js";
import { getPerformancesFromSegments } from "../../utils/getPerformancesFromSegments.js";
import compiledTemplates from "../../../../templateCache.json" with { type: "json" };
import { getRandomIndex } from "../../utils/getRandomIndex.js";

const getRandomElements = (arr: any[], n: number) => {
  const safeN = n < arr.length ? n : arr.length;
  return [...arr].sort(() => 0.5 - Math.random()).slice(0, safeN);
};

export const renderPrivateDashboard = (segments: any): string => {
  const formatedSegments = formatSegments(segments);
  const { formattedArtist, artistId } = formatedSegments[0];
  const performances = getPerformancesFromSegments(formatedSegments);
  const portfolioImages = [] as string[][];

  const gridHtml = performances.private
    .map((performance) => {
      const random = getRandomElements(performance.images, 8);
      portfolioImages.push(random);
      return renderComponent(
        compiledTemplates.PrivatePerformanceCard,
        performance,
      );
    })
    .join("");
  const flattedImagesArray = portfolioImages.flat();
  const htmlContent = renderComponent(compiledTemplates.PrivateDashboard, {
    title: `${formattedArtist}`,
    count: performances.private.length,
    gridHtml,
    heroImages: JSON.stringify(flattedImagesArray),
    heroImage: formatedSegments[getRandomIndex(formatedSegments)].heroImage,
    heroBackTitle: "See public Profile",
    heroBackLink: artistId,
  });
  return htmlContent;
};
