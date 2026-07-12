import { mkdirSync, writeFileSync } from "fs";
import { join } from "path";
import { ArtistWorkspaceObject } from "../../../templates/types.js";

import { renderPrivateDashboard } from "../../../templates/artistPrivate/index.js";

export const compilePrivateDashboard = (
  artist: ArtistWorkspaceObject,
  images: any,
): void => {
  const outputDir = join(
    process.cwd(),
    "public/artists",
    artist.artistId,
    "private",
  );
  mkdirSync(outputDir, { recursive: true });
  const htmlContent = renderPrivateDashboard(artist, images[artist.artistName]);
  const outputPath = join(outputDir, `index.html`);
  writeFileSync(outputPath, htmlContent, "utf8");
};
