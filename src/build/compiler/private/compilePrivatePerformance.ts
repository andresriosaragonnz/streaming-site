import { writeFileSync, mkdirSync } from "fs";
import { join } from "path";

import { renderPrivatePerformance } from "../../../templates/artistPrivate/privatePerformance.js";

export const compilePrivatePerformance = (
  artistName: string,
  artistId: string,
  performance: any,
): void => {
  const outputDir = join(
    process.cwd(),
    "public/artists",
    artistId,
    "private",
    `${performance.venueName}-${performance.eventDate}`,
  );
  mkdirSync(outputDir, { recursive: true });
  // Map data into template renderer
  const htmlContent = renderPrivatePerformance({
    artistName: artistName,
    venueName: performance.venueName,
    eventDate: performance.eventDate,
    segments: performance.segments,
    performance: performance.performance,
  });
  const outputPath = join(outputDir, `index.html`);
  writeFileSync(outputPath, htmlContent, "utf8");
};
