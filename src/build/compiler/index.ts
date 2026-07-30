// src/build/compiler.ts

import { formatSegments } from "./utils/formatSegment.js";
import { getPerformancesFromSegments } from "./utils/getPerformancesFromSegments.js";
import { saveChache } from "../../utils/component.js";

// Import your existing template generation engines
import { compilePrivateDashboards } from "./private/compilePrivateDashboards.js";
import { compilePrivatePerformances } from "./private/compilePrivatePerformances.js";
import { compilePublicPortfolios } from "./public/compilePublicPortfolios.js";
import { compilePublicPerformances } from "./public/compilePublicPerformances.js";

export function compileArtistPages(data: any): void {
  const formattedSegments = formatSegments(data);
  const performances = getPerformancesFromSegments(formattedSegments);

  const privateDashboards = compilePrivateDashboards(performances);
  const privatePerformances = compilePrivatePerformances(performances);
  const publicPortfolios = compilePublicPortfolios(performances);
  const publicPerformances = compilePublicPerformances(performances);
  // saveChache();
  return privateDashboards.concat(
    privatePerformances,
    publicPortfolios,
    publicPerformances,
  );
}
