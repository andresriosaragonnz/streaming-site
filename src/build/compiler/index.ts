// src/build/compiler.ts
import { mkdirSync, readdirSync, existsSync, rmSync } from "fs";
import { join } from "path";
import { ArtistWorkspaceObject } from "../types.js";
import { data } from "./artistData.js";
import { indexImages } from "./indexImages.js";
import { compileStylesheets } from "./css.js";

// Import your existing template generation engines
import { compilePrivateDashboard } from "./private/compilePrivateDashboard.js";
import { compilePrivatePerformance } from "./private/compilePrivatePerformance.js";
import { compilePublicPortfolio } from "./public/compilePublicPortfolio.js";
import { compilePublicPerformance } from "./public/compilePublicPerformance.js";

const DIST_DIR = join(import.meta.dir, "../../../public");
const HERO_DIR = join(DIST_DIR, "screenshots/hero");
const CARD_DIR = join(DIST_DIR, "screenshots/card");

export function compileArtistEcosystem(artist: ArtistWorkspaceObject): void {
  console.log(
    `🔨 Atomically building assets for artist: ${artist.artistName} (${artist.artistId})`,
  );
  console.time("compile");
  if (!existsSync(HERO_DIR) || !existsSync(CARD_DIR)) {
    throw new Error("images dir missing");
  }
  compileStylesheets();
  const rootArtistsDir = join(process.cwd(), "public/artists", artist.artistId);
  rmSync(rootArtistsDir, { recursive: true, force: true });
  const heroFiles = readdirSync(HERO_DIR);
  const filteredHero = heroFiles.filter(
    (image) => image.split("-")[0] === artist.artistName,
  );
  const artistImages = indexImages(filteredHero, "artist");
  compilePrivateDashboard(artist, artistImages);
  const publicPerformances = [];
  const publicSegments = [] as any;
  for (const performance of artist.performances) {
    const filteredPublic = performance.segments.filter(
      (segment) => segment.status === "public",
    );
    if (filteredPublic.length > 0) {
      publicPerformances.push({
        ...performance,
        segments: filteredPublic,
      });
      publicSegments.push(filteredPublic);
    }
    compilePrivatePerformance(artist.artistName, artist.artistId, performance);
  }
  if (publicPerformances.length === 0) {
    return;
  }
  const publicImages = publicSegments
    .flat()
    .map((segment: any) => `${segment.performance}-hero_${segment.index}`);
  compilePublicPortfolio(
    { ...artist, performances: publicPerformances },
    publicImages,
  );
  for (const performance of publicPerformances) {
    compilePublicPerformance(artist.artistId, performance);
  }
  console.timeEnd("compile");
  return;
  // 2. Build the public artist index/portfolio landing view page
  const publicOutputDir = join(
    process.cwd(),
    "public/artists",
    artist.artistId,
  );
  mkdirSync(publicOutputDir, { recursive: true });

  // const publicHtml = renderPublicPortfolio(artist);
  // writeFileSync(join(publicOutputDir, "index.html"), publicHtml, "utf8");

  // console.log(
  //   `✨ Successfully generated static outputs for /artists/${artist.artistId}/`,
  // );
}

compileArtistEcosystem(data);
