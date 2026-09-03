import { formatSegments } from "../../compiler/formatSegments/index";
import { getPerformancesFromSegments } from "../../compiler/utils/getPerformancesFromSegments.js";
import { PublicPortfolioLayout } from "./PublicPortfolio/PublicPortfolioLayout";
import { PublicPerformancePageLayout } from "./PublicPerformance/PublicPerformancePageLayout";
import { NotFoundPageLayout } from "./Missing";

const CACHED_404_HTML = "<!doctype html>\n" + <NotFoundPageLayout />;

export const renderPublicEcosystem = (segments: any, graphDataJS: any): any => {
  const { formattedSegments } = formatSegments(segments);
  const performances = getPerformancesFromSegments(formattedSegments);

  const performanceIndex: Record<string, { key: string; value: string }> = {};

  // 1. Portfolio layout execution
  performanceIndex[segments[0].artistName] = {
    key: segments[0].artistName,
    value:
      "<!doctype html>\n" +
      PublicPortfolioLayout({
        performances: performances.public,
        segments: formattedSegments,
        graphDataJS,
      }),
  };

  // 2. Private performance 404 pages
  for (const performance of performances.private) {
    performanceIndex[performance.performance] = {
      key: performance.performance,
      value: CACHED_404_HTML,
    };
  }

  // 3. Public performance page execution
  for (const performance of performances.public) {
    performanceIndex[performance.performance] = {
      key: performance.performance,
      value:
        "<!doctype html>\n" +
        PublicPerformancePageLayout({
          segments: performance.segments,
          pageTitle: performance.formattedPerformanceTitle,
        }),
    };
  }

  return Object.values(performanceIndex);
};
