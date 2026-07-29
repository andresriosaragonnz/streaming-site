// src/build/compiler.ts
import { mkdirSync, readdirSync, existsSync, rmSync } from "fs";
import { join } from "path";
import { ArtistWorkspaceObject } from "../types.js";
import { data } from "./artistData.js";
import { compileStylesheets } from "./css.js";
import { formatSegments } from "./utils/formatSegment.js";
import { getPerformancesFromSegments } from "./utils/getPerformancesFromSegments.js";
import { getArtistFromSegment } from "./utils/getArtistFromSegment.js";

// Import your existing template generation engines
import { compilePrivateDashboard } from "./private/compilePrivateDashboard.js";
import { compilePrivatePerformances } from "./private/compilePrivatePerformance.js";
import { compilePublicPortfolio } from "./public/compilePublicPortfolio.js";
import { compilePublicPerformances } from "./public/compilePublicPerformance.js";
import { compilePlaylist } from "./playlist/compilePlaylistView.js";

export function compileArtistEcosystem(data: any, artistId: string): void {
  console.log(`🔨 Atomically building assets for artist: ${artistId} `);
  console.time("compile");
  const formattedSegments = formatSegments(data);

  compileStylesheets();
  const rootArtistsDir = join(process.cwd(), "public/artists", artistId);
  rmSync(rootArtistsDir, { recursive: true, force: true });

  const publicSegments = formattedSegments.filter(
    (segment) => segment.status === "public",
  ) as any;
  const performances = getPerformancesFromSegments(formattedSegments);
  const publicPerformances = getPerformancesFromSegments(publicSegments);
  const artist = getArtistFromSegment(formattedSegments);
  compilePrivateDashboard(artist, performances);
  compilePrivatePerformances(performances);
  compilePublicPortfolio(artist, publicPerformances);
  compilePublicPerformances(publicPerformances);
  console.timeEnd("compile");
  return;
  return;
}
compileArtistEcosystem(
  data.filter((d) => d.artistId === "decibel_force"),
  "decibel_force",
);
