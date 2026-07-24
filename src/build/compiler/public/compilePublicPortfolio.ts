import { mkdirSync, writeFileSync } from "fs";
import { join } from "path";
import type { ArtistWorkspaceObject } from "../../types.js";
import { loadComponent } from "../../../utils/component.js";
import type { CardProps, HeroProps, LayoutProps } from "../../types.js";
import { getArtistFromSegment } from "../utils/getArtistFromSegment.js";

const Menu = loadComponent("Menu.html");
const Layout = loadComponent<LayoutProps>("BaseLayout.html");
const Hero = loadComponent<HeroProps>("Hero.html");
const PrivatePerformanceCard = loadComponent<CardProps>(
  "/private/templates/PrivatePerformanceCard.html",
);

export const compilePublicPortfolio = (
  segments: any,
  performances: any,
): void => {
  const artist = getArtistFromSegment(segments);
  const outputDir = join(process.cwd(), "public/artists", artist.id);
  mkdirSync(outputDir, { recursive: true });
  const gridHtml = performances.map(PrivatePerformanceCard).join("");
  const heroHtml = Hero({
    image: artist.image,
    title: artist.name.replaceAll("_", " "),
    count: performances ? performances.length : 0,
  });
  const menuHtml = Menu({});
  const htmlContent = Layout({
    pageTitle: artist.name,
    bodyContent: `
    ${menuHtml}
    ${heroHtml}
    <main class="performance-grid">
    ${gridHtml}
    </main>
    `,
  });

  const outputPath = join(outputDir, `index.html`);
  console.log({ outputPath });
  writeFileSync(outputPath, htmlContent, "utf8");
  return;
};
