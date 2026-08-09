import { renderComponent } from "../../renderPage.js";
import { formatSegments } from "../../formatSegments/index.js";
import { getPerformancesFromSegments } from "../../utils/getPerformancesFromSegments.js";
import compiledTemplates from "../../../../templateCache.json" with { type: "json" };
import { getRandomIndex } from "../../utils/getRandomIndex.js";

export const renderPrivateDashboard = (segments: any): string => {
  const formatedSegments = formatSegments(segments);
  const { formattedArtist, artistId } = formatedSegments[0];
  const performances = getPerformancesFromSegments(formatedSegments);
  const gridHtml = performances.private
    .map((performance) =>
      renderComponent(compiledTemplates.PrivatePerformanceCard, performance),
    )
    .join("");
  const htmlContent = renderComponent(compiledTemplates.PrivateDashboard, {
    title: `${formattedArtist}`,
    count: performances.private.length,
    gridHtml,
    heroImage: formatedSegments[getRandomIndex(formatedSegments)].heroImage,
    heroBackTitle: "See public Profile",
    heroBackLink: artistId,
  });
  return htmlContent;
};
