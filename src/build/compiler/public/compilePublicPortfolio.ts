import { writeFileSync, mkdirSync, readdirSync, existsSync, rmSync } from "fs";
import { join } from "path";
import { ArtistWorkspaceObject } from "../../../templates/types.js";

import { renderPublicPortfolio } from "../../../templates/artistPublic/index.js";

export const compilePublicPortfolio = (
  artist: ArtistWorkspaceObject,
  images: any,
): void => {
  const outputDir = join(process.cwd(), "public/artists", artist.artistId);
  mkdirSync(outputDir, { recursive: true });
  const htmlContent = renderPublicPortfolio(artist, images);
  const outputPath = join(outputDir, `index.html`);
  writeFileSync(outputPath, htmlContent, "utf8");
};
