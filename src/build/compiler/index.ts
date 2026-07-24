// src/build/compiler.ts
import { mkdirSync, readdirSync, existsSync, rmSync } from "fs";
import { join } from "path";
import { ArtistWorkspaceObject } from "../types.js";
import { data } from "./artistData.js";
import { compileStylesheets } from "./css.js";
import { getPerformancesFromSegments } from "./utils/getPerformancesFromSegments.js";

// Import your existing template generation engines
import { compilePrivateDashboard } from "./private/compilePrivateDashboard.js";
import { compilePrivatePerformances } from "./private/compilePrivatePerformance.js";
import { compilePublicPortfolio } from "./public/compilePublicPortfolio.js";
import { compilePublicPerformances } from "./public/compilePublicPerformance.js";
import { compilePlaylistView } from "./playlist/compilePlaylistView.js";

const DIST_DIR = join(import.meta.dir, "../../../public");
const HERO_DIR = join(DIST_DIR, "screenshots/hero");
const CARD_DIR = join(DIST_DIR, "screenshots/card");

export function compileArtistEcosystem(
  artistSegments: any,
  artistId: string,
): void {
  console.log(`🔨 Atomically building assets for artist: ${artistId} `);
  console.time("compile");
  if (!existsSync(HERO_DIR) || !existsSync(CARD_DIR)) {
    throw new Error("images dir missing");
  }
  compileStylesheets();
  const rootArtistsDir = join(process.cwd(), "public/artists", artistId);
  rmSync(rootArtistsDir, { recursive: true, force: true });
  // const heroFiles = readdirSync(HERO_DIR);
  // const filteredHero = heroFiles.filter(
  //   (image) => image.split("-")[0] === artistId,
  // );
  // const artistImages = indexImages(filteredHero, "artist");
  const publicSegments = artistSegments.filter(
    (segment) => segment.status === "public",
  ) as any;
  const performances = getPerformancesFromSegments(artistSegments);
  const publicPerformances = getPerformancesFromSegments(publicSegments);
  compilePrivateDashboard(artistSegments, performances);
  compilePublicPortfolio(publicSegments, publicPerformances);
  compilePrivatePerformances(performances);
  compilePublicPerformances(publicSegments, publicPerformances);
  return;

  for (const performance of artist.performances) {
    compilePrivatePerformance(artist.artistName, artist.artistId, performance);
    const filteredPublic = performance.segments
      .filter((segment) => segment.status === "public")
      .map((seg) => ({
        ...seg,
        artistName: artist.artistName,
        eventDate: performance.eventDate,
        venueName: performance.venueName,
      }));
    if (filteredPublic.length > 0) {
      publicPerformances.push({
        ...performance,
        segments: filteredPublic,
      });
      publicSegments.push(filteredPublic);
    }
  }
  if (publicPerformances.length === 0) {
    return;
  }
  const publicImages = publicSegments
    .flat()
    .map((segment: any) => `${segment.id}`);

  compilePublicPortfolio(
    { ...artist, performances: publicPerformances },
    publicImages,
  );
  for (const performance of publicPerformances) {
    compilePublicPerformance(artist.artistId, performance);
  }
  console.timeEnd("compile");
  // 2. Build the public artist index/portfolio landing view page
  const publicOutputDir = join(
    process.cwd(),
    "public/artists",
    artist.artistId,
  );
  mkdirSync(publicOutputDir, { recursive: true });
  compilePlaylistView(publicSegments.flat());
  return;

  // console.log(
  //   `✨ Successfully generated static outputs for /artists/${artist.artistId}/`,
  // );
}

compileArtistEcosystem(
  data.filter((seg) => seg.artistId === "decibel_force"),
  "decibel_force",
);
