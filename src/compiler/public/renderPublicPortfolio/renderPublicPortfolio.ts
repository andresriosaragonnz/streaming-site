import { renderComponent } from "../../renderPage.js";
import compiledTemplates from "../../../../templateCache.json" with { type: "json" };
import { getRandomIndex } from "../../utils/getRandomIndex.js";

export const renderPublicPortfolio = (
  performances: any,
  formatedSegments: any,
): string => {
  const { formattedArtist } = formatedSegments[0];
  if (performances.public.length === 0) {
    return `<div>empty</div>`;
  }
  const gridHtml = performances.public
    .map((performance: any) =>
      renderComponent(compiledTemplates.PublicPerformanceCard, performance),
    )
    .join("");
  const htmlContent = renderComponent(compiledTemplates.PublicPortfolio, {
    title: `${formattedArtist}`,
    count: performances.private.length,
    gridHtml,
    heroImage: formatedSegments[getRandomIndex(formatedSegments)].heroImage,
  });
  return htmlContent;
};
