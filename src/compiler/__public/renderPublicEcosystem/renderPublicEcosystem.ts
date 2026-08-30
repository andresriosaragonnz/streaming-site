import { formatSegments } from "../../formatSegments/index.js";
import { getPerformancesFromSegments } from "../../utils/getPerformancesFromSegments.js";
import { renderPublicPortfolio } from "../renderPublicPortfolio/renderPublicPortfolio.js";
import { renderPublicPerformance } from "../renderPublicPerformance/renderPublicPerformance.js";
import { renderComponent } from "../../renderPage.js";
import compiledTemplates from "../../../../templateCache.json" with { type: "json" };

export const renderPublicEcosystem = (segments: any, graph: any): any => {
  const { formattedSegments } = formatSegments(segments);
  const performances = getPerformancesFromSegments(formattedSegments);

  const performanceIndex = {} as any;
  performanceIndex[segments[0].artistName] = {
    key: segments[0].artistName,
    value: renderPublicPortfolio(performances, formattedSegments),
  };

  for (const performance of performances.private) {
    performanceIndex[performance.performance] = {
      value: renderComponent(compiledTemplates.Missing, {}),
      key: performance.performance,
    };
  }
  for (const performance of performances.public) {
    performanceIndex[performance.performance] = {
      value: renderPublicPerformance(performance),
      key: performance.performance,
    };
  }
  return Object.values(performanceIndex);
};
