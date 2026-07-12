// src/buildArtist.ts
import { rmSync, mkdirSync } from "fs";
import { join } from "path";
import { compileArtistEcosystem } from "./compiler.js";
import { ArtistWorkspaceObject } from "./types.js";

/**
 * High-performance incremental static generation method triggered via updates
 */
export async function buildArtist(
  singleArtistPayload: ArtistWorkspaceObject,
): Promise<void> {
  if (!singleArtistPayload || !singleArtistPayload.artistId) {
    throw new Error(
      "❌ Cannot run atomic compilation: Invalid or missing Artist Payload Object.",
    );
  }

  const targetDir = join(
    process.cwd(),
    "public/artists",
    singleArtistPayload.artistId,
  );
  console.log(
    `⚡ ISR Triggered: Cleaning and rebuilding /artists/${singleArtistPayload.artistId}/`,
  );

  const startTime = performance.now();

  // 1. Remove ONLY this artist's folder structure safely if it exists
  rmSync(targetDir, { recursive: true, force: true });

  // 2. Re-create the specific artist base path directory block
  mkdirSync(targetDir, { recursive: true });

  // 3. Compile fresh pages into the clean slate
  compileArtistEcosystem(singleArtistPayload);

  const duration = (performance.now() - startTime).toFixed(2);
  console.log(`✅ Targeted atomic rebuild completed in ${duration}ms.`);
}
