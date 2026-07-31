import { readAndExpandTemplate, compilePage } from "../../utils/compile.js";

export const compileAll = (): any => {
  const menuHtml = readAndExpandTemplate("/components/Menu.html");
  const baseLayoutHtml = readAndExpandTemplate("/components/BaseLayout.html");
  const heroHtml = readAndExpandTemplate("/components/Hero.html");
  const privatePerformanceCard = readAndExpandTemplate(
    "/private/templates/PrivatePerformanceCard.html",
  );

  const privateDashboard = compilePage(baseLayoutHtml, {
    bodyContent: `
    <div style="position:fixed;z-index:20;padding:4rem">${menuHtml}</div>
    ${heroHtml}
    <main class="performance-grid">
    {{gridHtml}}
    </main>
    `,
  });

  return { privateDashboard };
};

export const compilePrivatePerformanceCard = () => {};

console.log(compileAll());
