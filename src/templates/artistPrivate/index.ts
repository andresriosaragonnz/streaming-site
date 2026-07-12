import type { ArtistWorkspaceObject } from "../../templates/types.js";
import { loadComponent } from "../../utils/component.js";
import { dateFromString } from "../../utils/formatDates.js";
import type { CardProps, HeroProps, LayoutProps } from "../types.js";

const Layout = loadComponent<LayoutProps>("BaseLayout.html");
const Hero = loadComponent<HeroProps>("Hero.html");
const PrivatePerformanceCard = loadComponent<CardProps>(
  "PrivatePerformanceCard.html",
);

export const renderPrivateDashboard = (
  artist: ArtistWorkspaceObject,
  images: string[],
): string => {
  const { artistName, performances } = artist;
  if (images.length === 0) {
    throw new Error("artist does not have images");
  }
  const currentImage = images[Math.floor(Math.random() * images.length)];
  const gridHtml = performances
    .map((p, index) => {
      const { eventDate, venueName, performance } = p;
      const date = eventDate
        ? dateFromString(eventDate).formated
        : "Undated Tapes";
      return PrivatePerformanceCard({
        artistName: encodeURIComponent(artistName),
        link: `${venueName}-${eventDate}`,
        image: `/screenshots/card/${performance}-card_${index}.jpg`,
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

  return Layout({
    pageTitle: artistName,
    bodyContent: `
      ${heroHtml}
      <main class="performance-grid">
        ${gridHtml}
      </main>
    `,
  });
};
