import { readAndExpandTemplate } from "./readAndExpandTemplate.js";
import { compileStylesheets } from "./css.js";
import fs from "fs";

const compileCache = () => {
  compileStylesheets();
  const cache = {
    PrivateDashboard: readAndExpandTemplate(
      "/private/renderPrivateDashboard/PrivateDashboard.html",
    ),
    PrivatePerformanceCard: readAndExpandTemplate(
      "/private/renderPrivateDashboard/PrivatePerformanceCard.html",
    ),
    PrivatePerformance: readAndExpandTemplate(
      "/private/renderPrivatePerformance/PrivatePerformance.html",
    ),
    PrivateSegmentCard: readAndExpandTemplate(
      "/private/renderPrivatePerformance/PrivateSegmentCard.html",
    ),
    PublicPortfolio: readAndExpandTemplate(
      "/public/renderPublicPortfolio/PublicPortfolio.html",
    ),
    PublicPerformanceCard: readAndExpandTemplate(
      "/public/renderPublicPortfolio/PublicPerformanceCard.html",
    ),
    PublicPerformance: readAndExpandTemplate(
      "/public/renderPublicPerformance/PublicPerformance.html",
    ),
    PublicSegmentCard: readAndExpandTemplate(
      "/public/renderPublicPerformance/PublicSegmentCard.html",
    ),
    Missing: readAndExpandTemplate("/public/Missing.html"),
  };
  fs.writeFileSync("./templateCache.json", JSON.stringify(cache));
};

compileCache();
