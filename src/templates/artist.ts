import { loadComponent } from "../utils/component.js";
import { dateFromString } from "../utils/formatDates.js";

// 1. Strictly define what your HTML placeholders require
interface HeroProps {
  bgImage: string;
  title: string;
  count: number;
}

interface CardProps {
  artistName: string;
  id: string | number;
  image: string;
  venue: string;
  date: string;
}

interface LayoutProps {
  pageTitle: string;
  bodyContent: string;
  extraScripts?: string;
}

interface Performance {
  ID: number;
  ImageURL?: string;
  VenueName?: string;
  EventDate?: string;
  Mode?: string;
}

interface ArtistData {
  name: string;
  photo?: string;
  performances: Performance[];
}

// 2. Load the components passing the Type interfaces
const Layout = loadComponent<LayoutProps>("BaseLayout.html");
const Hero = loadComponent<HeroProps>("Hero.html");
const PerformanceCard = loadComponent<CardProps>("PerformanceCard.html");
const PrivatePerformanceCard = loadComponent<CardProps>(
  "PrivatePerformanceCard.html",
);

export function render(artist: ArtistData): string {
  const heroImage = artist.photo || "";

  const gridHtml = (artist.performances || [])
    .map((p) => {
      // Your editor will flag an error here if a property name is misspelled!
      const date = p.EventDate
        ? dateFromString(p.EventDate).formated
        : "Undated Tapes";
      if (artist.mode === "private") {
        return PrivatePerformanceCard({
          artistName: encodeURIComponent(artist.name),
          id: p.ID,
          image: p.ImageURL || "",
          venue: p.VenueName || "Unknown Venue",
          date,
        });
      }
      return PerformanceCard({
        artistName: encodeURIComponent(artist.name),
        id: p.ID,
        image: p.ImageURL || "",
        venue: p.VenueName || "Unknown Venue",
        date,
      });
    })
    .join("");

  const heroHtml = Hero({
    bgImage: heroImage,
    title: artist.name.replaceAll("_", " "),
    count: artist.performances ? artist.performances.length : 0,
  });

  return Layout({
    pageTitle: artist.name,
    bodyContent: `
      ${heroHtml}
      <main class="performance-grid">
        ${gridHtml}
      </main>
    `,
    extraScripts: ``,
  });
}
