import { mkdirSync, writeFileSync } from "fs";
import { join } from "path";
import { loadComponent } from "../../../utils/component.js";
import type { CardProps, HeroProps, LayoutProps } from "../../types.js";

const Menu = loadComponent("/components/Menu.html");
const Layout = loadComponent<LayoutProps>("/components/BaseLayout.html");
const Hero = loadComponent<HeroProps>("/components/Hero.html");
const PublicPerformanceCard = loadComponent<CardProps>(
  "/public/templates/PublicPerformanceCard.html",
);

export const compilePublicPortfolio = (artist: any): string => {
  const { performances, heroImage, artistName } = artist;
  const gridHtml = performances.map(PublicPerformanceCard).join("");
  const heroHtml = Hero({
    heroImage,
    title: artistName.replaceAll("_", " "),
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
  return htmlContent;
};
