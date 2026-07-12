// src/buildAll.ts
import { rmSync, mkdirSync } from "fs";
import { join } from "path";
import { compileArtistEcosystem } from "./compiler.js";
import { ArtistWorkspaceObject } from "./types.js";

/**
 * Compiles every single artist page configuration registered inside the ecosystem payload
 */
export async function buildAll(
  allArtistsPayload: ArtistWorkspaceObject[],
): Promise<void> {
  const rootArtistsDir = join(process.cwd(), "public/artists");
  console.log(
    `🚀 Starting Global Rebuild Pass: Purging all existing artist static assets...`,
  );

  // 1. Completely destroy the entire root directory path structure
  rmSync(rootArtistsDir, { recursive: true, force: true });

  // 2. Guarantee foundation directory paths exist safely for the fresh loop
  mkdirSync(rootArtistsDir, { recursive: true });

  // 3. Loop over all payload objects sequentially
  for (const artist of allArtistsPayload) {
    try {
      compileArtistEcosystem(artist);
    } catch (err) {
      console.error(
        `❌ Failed to compile artist profile: ${artist.artistId}`,
        err,
      );
    }
  }

  console.log(
    "🏁 Global portfolio compiling run sequence completed successfully.",
  );
}
