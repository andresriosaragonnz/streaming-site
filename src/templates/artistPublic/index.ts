import { loadComponent } from "../../utils/component.js";
import { dateFromString } from "../../utils/formatDates.js";
import type {
  HeroProps,
  CardProps,
  LayoutProps,
  ArtistData,
} from "../types.js";

const Layout = loadComponent<LayoutProps>("BaseLayout.html");
const Hero = loadComponent<HeroProps>("Hero.html");
const PerformanceCard = loadComponent<CardProps>("PerformanceCard.html");

export const renderPublicPortfolio = (
  artist: ArtistData,
  images: string[],
): string => {
  const currentImage = images[Math.floor(Math.random() * images.length)];
  const heroImage = `/screenshots/hero/${currentImage}.jpg`;
  const gridHtml = (artist.performances || [])
    .map((p) => {
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
        image: `/screenshots/card/${p.performance}-card_${currentCardImage}.jpg`,
        venue: p.venueName || "Unknown Venue",
        date,
        link: `${p.venueName}-${p.eventDate}`,
      });
    })
    .join("");
  const heroHtml = Hero({
    bgImage: heroImage,
    title: artist.artistName.replaceAll("_", " "),
    count: artist.performances ? artist.performances.length : 0,
  });

  return Layout({
    pageTitle: artist.artistName,
    bodyContent: `
      ${heroHtml}
      <main class="performance-grid">
        ${gridHtml}
      </main>
    `,
  });
};
