import { mkdirSync, writeFileSync } from "fs";
import { join } from "path";
import type { ArtistWorkspaceObject } from "../../types.js";
import { loadComponent } from "../../../utils/component.js";
import { dateFromString } from "../../../utils/formatDates.js";
import type { CardProps, HeroProps, LayoutProps } from "../../types.js";

const Layout = loadComponent<LayoutProps>("BaseLayout.html");
const Hero = loadComponent<HeroProps>("Hero.html");
const PrivatePerformanceCard = loadComponent<CardProps>(
  "/private/templates/PrivatePerformanceCard.html",
);

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

  const { artistName, performances } = artist;
  if (images.length === 0) {
    throw new Error("artist does not have images");
  }
  const currentImage = images[Math.floor(Math.random() * images.length)];
  const gridHtml = performances
    .map((p, index) => {
      const { eventDate, venueName, performance, id } = p;
      const date = eventDate
        ? dateFromString(eventDate).formated
        : "Undated Tapes";
      return PrivatePerformanceCard({
        artistName: encodeURIComponent(artistName),
        link: `${venueName}-${eventDate}`,
        image: `/screenshots/card/${id}.jpg`,
        venue: venueName || "Unknown Venue",
        date,
      });
    })
    .join("");

  const heroHtml = Hero({
    bgImage: `/screenshots/hero/${currentImage}`,
    title: artistName.replaceAll("_", " "),
    count: performances ? performances.length : 0,
  });

  const htmlContent = Layout({
    pageTitle: artistName,
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
