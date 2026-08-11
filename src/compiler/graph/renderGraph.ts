import { renderComponent } from "../renderPage.js";
import compiledTemplates from "../../../templateCache.json" with { type: "json" };

export const renderGraph = (graphData: any): string => {
  console.log({ graphData });
  const htmlContent = renderComponent(compiledTemplates.Graph, {
    graphDataJS: JSON.stringify(graphData),
  });
  return htmlContent;
};
