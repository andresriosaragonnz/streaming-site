import { renderComponent } from "../../renderPage.js";

import compiledTemplates from "../../../../templateCache.json" with { type: "json" };

export const renderClaim = (artists: string[]): string => {
  const gridHtml = artists
    .map((artist) => `<li> ${artist.replaceAll("_", " ")}</li>`)
    .join("");
  const htmlContent = renderComponent(compiledTemplates.Claim, {
    gridHtml,
    jsonArtists: JSON.stringify(artists),
  });
  return htmlContent;
};
