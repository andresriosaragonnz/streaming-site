import { formatSegments } from "../../utils/formatSegment.js";
import { getPerformancesFromSegments } from "../../utils/getPerformancesFromSegments.js";
import { renderPublicPortfolio } from "../renderPublicPortfolio/renderPublicPortfolio.js";
import { renderPublicPerformance } from "../renderPublicPerformance/renderPublicPerformance.js";

export const renderPublicEcosystem = (segments: any): any => {
  const formatedSegments = formatSegments(segments);
  const performances = getPerformancesFromSegments(formatedSegments);

  const performanceIndex = {} as any;
  performanceIndex[segments[0].artistId] = {
    key: segments[0].artistId,
    value: renderPublicPortfolio(performances, formatedSegments),
  };

  for (const performance of performances.private) {
    performanceIndex[performance.performance] = {
      value: `<div> Error</div>`,
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
