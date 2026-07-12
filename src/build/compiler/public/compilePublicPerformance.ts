import { writeFileSync, mkdirSync } from "fs";
import { join } from "path";

import { renderPublicPerformance } from "../../../templates/artistPublic/publicPerformance.js";

export function compilePublicPerformance(
  artistId: string,
  performance: any,
): void {
  const outputDir = join(
    process.cwd(),
    "public/artists",
    artistId,
    `${performance.venueName}-${performance.eventDate}`,
  );
  mkdirSync(outputDir, { recursive: true });
  // Map data into template rend  erer
  const htmlContent = renderPublicPerformance(performance);

  const outputPath = join(outputDir, `index.html`);
  writeFileSync(outputPath, htmlContent, "utf8");
}
