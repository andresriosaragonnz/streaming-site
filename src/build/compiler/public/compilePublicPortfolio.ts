import { writeFileSync, mkdirSync } from "fs";
import { join } from "path";
import {
  ArtistWorkspaceObject,
  HeroProps,
  CardProps,
  LayoutProps,
  ArtistData,
} from "../../types.js";

import { loadComponent } from "../../../utils/component.js";
import { dateFromString } from "../../../utils/formatDates.js";

const Layout = loadComponent<LayoutProps>("BaseLayout.html");
const Hero = loadComponent<HeroProps>("Hero.html");
const PerformanceCard = loadComponent<CardProps>(
  "/public/templates/PublicPerformanceCard.html",
);

export const compilePublicPortfolio = (
  artist: ArtistWorkspaceObject,
  images: any,
): void => {
  const outputDir = join(process.cwd(), "public/artists", artist.artistId);
  mkdirSync(outputDir, { recursive: true });
  const currentImage = images[Math.floor(Math.random() * images.length)];
  const heroImage = `/screenshots/hero/${currentImage}.jpg`;
  const gridHtml = (artist.performances || [])
    .map((p) => {
      const { eventDate, segments, id, venueName } = p;
      const date = p.eventDate
        ? dateFromString(p.eventDate).formated
        : "Undated Tapes";
      const availableImageIndices = p.segments.map((segment) => segment.index);
      const currentCardImage =
        availableImageIndices[
          Math.floor(Math.random() * availableImageIndices.length)
        ];
      return PerformanceCard({
        artistName: encodeURIComponent(artist.artistName),
        image: `/screenshots/card/${id}.jpg`,
        venue: venueName || "Unknown Venue",
        date,
        link: `${venueName}-${eventDate}`,
      });
    })
    .join("");
  const heroHtml = Hero({
    bgImage: heroImage,
    title: artist.artistName.replaceAll("_", " "),
    count: artist.performances ? artist.performances.length : 0,
  });

  const htmlContent = Layout({
    pageTitle: artist.artistName,
    bodyContent: `
      ${heroHtml}
      <main class="performance-grid">
        ${gridHtml}
      </main>
    `,
  });
  const outputPath = join(outputDir, `index.html`);
  writeFileSync(outputPath, htmlContent, "utf8");
};
