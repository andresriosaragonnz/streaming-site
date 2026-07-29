import fs from "node:fs";
import path from "node:path";

const templateCache: Record<string, string> = {};
const COMPONENT_DIR = path.join(process.cwd(), "src/build/compiler");

/**
 * Loads an HTML template file and recursively expands any nested template partials
 * matching the syntax: {{> partialFileName.html}}
 */
function readAndExpandTemplate(fileName: string): string {
  if (templateCache[fileName]) {
    return templateCache[fileName];
  }

  const filePath = path.join(COMPONENT_DIR, fileName);
  let rawHtml = fs.readFileSync(filePath, "utf8");

  // Regex matches: {{> partialName.html}} or {{> components/partialName.html}}
  const partialRegex = /\{\{\>\s*([a-zA-Z0-9_\-\.\/]+)\s*\}\}/g;

  // Replace each partial tag with the contents of that child file (recursively)
  rawHtml = rawHtml.replace(partialRegex, (_, partialFileName) => {
    return readAndExpandTemplate(partialFileName);
  });

  templateCache[fileName] = rawHtml;
  return rawHtml;
}

export function loadComponent<T extends object>(fileName: string) {
  // Pre-expand and cache all partials at load time
  const expandedTemplate = readAndExpandTemplate(fileName);

  return function renderComponent(props: T): string {
    let html = expandedTemplate;

    // Direct string replacement for props
    for (const [key, value] of Object.entries(props)) {
      html = html.split(`{{${key}}}`).join(String(value ?? ""));
    }

    return html;
  };
}
