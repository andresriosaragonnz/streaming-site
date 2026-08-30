import { formatSegments } from "../../compiler/formatSegments/index";
import { getPerformancesFromSegments } from "../../compiler/utils/getPerformancesFromSegments.js";
import { PublicPortfolioLayout } from "./PublicPortfolio/PublicPortfolioLayout";
import { PublicPerformancePageLayout } from "./PublicPerformance/PublicPerformancePageLayout";
import { NotFoundPageLayout } from "./Missing";

export const renderPublicEcosystem = (segments: any, graphDataJS: any): any => {
  const { formattedSegments } = formatSegments(segments);
  const performances = getPerformancesFromSegments(formattedSegments);

  const performanceIndex = {} as any;
  performanceIndex[segments[0].artistName] = {
    key: segments[0].artistName,
    value:
      "<!doctype html>\n" +
      (
        <PublicPortfolioLayout
          performances={performances.public}
          segments={formattedSegments}
          graphDataJS={graphDataJS}
        />
      ),
  };

  for (const performance of performances.private) {
    performanceIndex[performance.performance] = {
      value: "<!doctype html>\n" + <NotFoundPageLayout />,
      key: performance.performance,
    };
  }
  for (const performance of performances.public) {
    performanceIndex[performance.performance] = {
      value:
        "<!doctype html>\n" +
        <PublicPerformancePageLayout segments={performance.segments} />,
      key: performance.performance,
    };
  }
  return Object.values(performanceIndex);
};
