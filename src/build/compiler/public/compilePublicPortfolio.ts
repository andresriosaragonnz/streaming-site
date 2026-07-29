import { mkdirSync, writeFileSync } from "fs";
import { join } from "path";
import type { ArtistWorkspaceObject } from "../../types.js";
import { loadComponent } from "../../../utils/component.js";
import type { CardProps, HeroProps, LayoutProps } from "../../types.js";
import { getArtistFromSegment } from "../utils/getArtistFromSegment.js";

const Menu = loadComponent("/components/Menu.html");
const Layout = loadComponent<LayoutProps>("/components/BaseLayout.html");
const Hero = loadComponent<HeroProps>("/components/Hero.html");
const PublicPerformanceCard = loadComponent<CardProps>(
  "/public/templates/PublicPerformanceCard.html",
);

export const compilePublicPortfolio = (
  artist: any,
  performances: any,
): void => {
  const outputDir = join(process.cwd(), "public/artists", artist.id);
  mkdirSync(outputDir, { recursive: true });
  const gridHtml = performances.map(PublicPerformanceCard).join("");
  const heroHtml = Hero({
    image: artist.image,
    title: artist.name.replaceAll("_", " "),
    count: performances ? performances.length : 0,
  });
  const menuHtml = Menu({});
  const htmlContent = Layout({
    pageTitle: artist.name,
    bodyContent: `
    <div style="position:fixed;z-index:20;padding:4rem">${menuHtml}</div>
    ${heroHtml}
    <main class="performance-grid">
    ${gridHtml}
    </main>
    `,
  });

  const outputPath = join(outputDir, `index.html`);
  writeFileSync(outputPath, htmlContent, "utf8");
  return;
};
