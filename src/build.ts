import fs from "fs";
import path from "path";
import { render as renderIndex } from "./templates/index.js";
import { render as renderArtist } from "./templates/artist.js";
import { render as renderPerformance } from "./templates/performance.js";
import { render as renderPrivatePerformance } from "./templates/privatePerformance.js";

const DIST_DIR = path.join(import.meta.dir, "../public");
const ARTISTS_DIR = path.join(DIST_DIR, "artists"); // Isolated dynamic generation folder
const SEED_PATH = path.join(import.meta.dir, "../data.json");
const HERO_DIR = path.join(DIST_DIR, "screenshots/hero");
const CARD_DIR = path.join(DIST_DIR, "screenshots/card");

// --- 1. Type Definitions ---
interface TrackSegmentSeed {
  id: string;
  title: string;
  startTime: number;
  duration: number;
  hash: string;
  performance: string;
  source: string;
  status: "public" | "private";
}

interface PerformanceFileSeed {
  id: string;
  type: string;
  source: string;
  duration: number;
  setlist: TrackSegmentSeed[];
}

interface PerformanceSeed {
  id: string;
  status: string;
  artistName: string;
  eventDate: string;
  venueName: string;
  performance: string;
  hash: string;
  source: string;
  files: PerformanceFileSeed[];
}

interface ArtistProfileSeed {
  name: string;
  performances: PerformanceSeed[];
}

type ArtistCatalogSeed = Record<string, ArtistProfileSeed>;

// --- 2. Main Builder Execution ---
function runBuild() {
  console.log("🔄 Initializing dynamic compilation routine...");

  if (!fs.existsSync(SEED_PATH)) {
    console.error(
      `❌ Error: Could not locate seed catalog file at ${SEED_PATH}`,
    );
    process.exit(1);
  }

  const catalog: ArtistCatalogSeed = JSON.parse(
    fs.readFileSync(SEED_PATH, "utf8"),
  );

  // --- WIPE PASS: Clear out old/stale routing artifacts ---
  if (fs.existsSync(ARTISTS_DIR)) {
    console.log(
      "🧹 Wiping public/artists directory completely to prevent routing leaks...",
    );
    fs.rmSync(ARTISTS_DIR, { recursive: true, force: true });
  }

  // Re-verify compilation target directories exist
  fs.mkdirSync(DIST_DIR, { recursive: true });
  fs.mkdirSync(ARTISTS_DIR, { recursive: true });

  const heroFiles = fs.existsSync(HERO_DIR) ? fs.readdirSync(HERO_DIR) : [];
  const cardFiles = fs.existsSync(CARD_DIR) ? fs.readdirSync(CARD_DIR) : [];

  const dynamicIndexCatalog: any = {};

  for (const [slug, artistData] of Object.entries(catalog)) {
    const normalizedPrefix = slug.replace(/-/g, "_");
    const matchedHeroes = heroFiles.filter(
      (file) => file.startsWith(normalizedPrefix) && file.endsWith(".jpg"),
    );
    const chosenHero =
      matchedHeroes.length > 0
        ? `/screenshots/hero/${matchedHeroes[Math.floor(Math.random() * matchedHeroes.length)]}`
        : "/screenshots/hero/archive-banner-fallback.jpg";

    let artistHasAnyPublicContent = false;
    const publicPerformancesPayload: any[] = [];
    const privatePerformancesPayload: any[] = [];

    // Process Performance Portfolios
    artistData.performances
      .filter((p) => p.status === "ready")
      .forEach((p) => {
        const baseSearch = p.performance.replace(".mp4", "");
        const matchedCards = cardFiles.filter(
          (file) => file.startsWith(baseSearch) && file.endsWith(".jpg"),
        );
        const chosenCard =
          matchedCards.length > 0
            ? `/screenshots/card/${matchedCards[Math.floor(Math.random() * matchedCards.length)]}`
            : "/screenshots/card/card-fallback.jpg";

        const perfHeroName = `${baseSearch}.jpg`;
        const chosenPerfHero = heroFiles.includes(perfHeroName)
          ? `/screenshots/hero/${perfHeroName}`
          : chosenHero;
        const performanceUrlSlug = p.performance
          .split("-")
          .slice(1)
          .join("-")
          .replace(".mp4", "");

        const publicSegments: any[] = [];
        const allSegmentsForReview: any[] = [];

        p.files.forEach((file) => {
          (file.setlist || []).forEach((track, idx) => {
            const expectedSegmentCardName = `${baseSearch}_card_${idx + 1}.jpg`;
            const expectedSegmentHeroName = `${baseSearch}_hero_${idx + 1}.jpg`;
            const chosenSegmentCard = cardFiles.includes(
              expectedSegmentCardName,
            )
              ? `/screenshots/card/${expectedSegmentCardName}`
              : chosenCard;
            const chosenSegmentHero = heroFiles.includes(
              expectedSegmentHeroName,
            )
              ? `/screenshots/hero/${expectedSegmentHeroName}`
              : chosenCard;

            const segmentPayload = {
              id: track.id,
              title: track.title,
              cardImage: chosenSegmentCard,
              heroImage: chosenSegmentHero,
              status: track.status,
            };

            allSegmentsForReview.push(segmentPayload);
            if (track.status === "public") {
              publicSegments.push(segmentPayload);
            }
          });
        });

        const cardData = {
          ID: performanceUrlSlug,
          ImageURL: chosenCard,
          VenueName: p.venueName.replace(/_/g, " "),
          EventDate: p.eventDate,
        };

        privatePerformancesPayload.push(cardData);

        // --- 3. CONDITIONALLY REBUILD PUBLIC WATCH PAGE ---
        if (publicSegments.length > 0) {
          artistHasAnyPublicContent = true;
          publicPerformancesPayload.push(cardData);

          const publicRenderPayload = {
            artistName: p.artistName,
            venueName: p.venueName,
            eventDate: p.eventDate,
            heroImage: chosenPerfHero,
            segments: publicSegments,
          };

          const publicFolder = path.join(ARTISTS_DIR, slug, performanceUrlSlug);
          fs.mkdirSync(publicFolder, { recursive: true });
          fs.writeFileSync(
            path.join(publicFolder, "index.html"),
            renderPerformance(publicRenderPayload),
          );
          console.log(
            `    ↳ [PUBLIC] Created fresh: /artists/${slug}/${performanceUrlSlug}`,
          );
        } else {
          console.log(
            `    ⏭️ [PUBLIC] Skipped /artists/${slug}/${performanceUrlSlug} (0 public segments)`,
          );
        }

        // --- 4. ALWAYS REBUILD PRIVATE REVIEW SUB-PAGES ---
        const privateRenderPayload = {
          artistName: p.artistName,
          venueName: p.venueName,
          eventDate: p.eventDate,
          heroImage: chosenPerfHero,
          segments: allSegmentsForReview,
        };

        const privateFolder = path.join(
          ARTISTS_DIR,
          slug,
          "private",
          performanceUrlSlug,
        );
        fs.mkdirSync(privateFolder, { recursive: true });
        fs.writeFileSync(
          path.join(privateFolder, "index.html"),
          renderPrivatePerformance(privateRenderPayload),
        );
        console.log(
          `    🔒 [PRIVATE] Created fresh: /artists/${slug}/private/${performanceUrlSlug}`,
        );
      });

    // --- 5. ALWAYS REBUILD PRIVATE PORTFOLIO OVERVIEW ---
    const privateArtistPayload = {
      name: `${artistData.name}`,
      photo: chosenHero,
      performances: privatePerformancesPayload,
      mode: "private",
    };
    const privateArtistFolder = path.join(ARTISTS_DIR, slug, "private");
    fs.mkdirSync(privateArtistFolder, { recursive: true });
    fs.writeFileSync(
      path.join(privateArtistFolder, "index.html"),
      renderArtist(privateArtistPayload),
    );
    console.log(
      `  🔒 [PRIVATE] Created fresh Artist Hub: /artists/${slug}/private`,
    );

    // --- 6. CONDITIONALLY REBUILD PUBLIC PORTFOLIO ---
    if (artistHasAnyPublicContent) {
      const publicArtistPayload = {
        name: artistData.name,
        photo: chosenHero,
        performances: publicPerformancesPayload,
        mode: "public",
      };

      dynamicIndexCatalog[slug] = publicArtistPayload;

      const artistFolder = path.join(ARTISTS_DIR, slug);
      // Folder may already exist due to private builds, mkdir check handles it gracefully
      fs.mkdirSync(artistFolder, { recursive: true });
      fs.writeFileSync(
        path.join(artistFolder, "index.html"),
        renderArtist(publicArtistPayload),
      );
      console.log(
        `  ✨ [PUBLIC] Created fresh Portfolio Hub: /artists/${slug}`,
      );
    } else {
      console.log(
        `  ⏭️ [PUBLIC] Skipped Hub /artists/${slug} (No public performances found)`,
      );
    }
  }

  // 7. Write Main Landing Entry Page (Only maps public entries)
  fs.writeFileSync(
    path.join(DIST_DIR, "index.html"),
    renderIndex(dynamicIndexCatalog),
  );
  console.log(
    "✨ Compilation successful! Static state engine is clean and 1:1 with source schemas.",
  );
}

runBuild();
