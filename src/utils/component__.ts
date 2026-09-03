import fs from "node:fs";
import path from "node:path";

const templateCache: Record<string, string> = {};
const COMPONENT_DIR = path.join(process.cwd(), "src/build/compiler");
import compiledTemplates from "../../templateCache.json" with { type: "json" };

/**
 * Loads an HTML template file and recursively expands any nested template partials
 * matching the syntax: {{> partialFileName.html}}
 */
type CleanTemplates = Record<string, string>;

export function normalizeTemplates(
  rawTemplates: Record<string, string>,
): CleanTemplates {
  const normalized: CleanTemplates = {};

  for (const [key, value] of Object.entries(rawTemplates)) {
    // 1. Remove leading slash: "/components/Menu.html" -> "components/Menu.html"
    let cleanKey = key.startsWith("/") ? key.slice(1) : key;

    // 2. Remove file extension: "components/Menu.html" -> "components/Menu"
    cleanKey = cleanKey.replace(/\.[^/.]+$/, "");

    // 3. Store both full clean path ("components/Menu") and simple name ("Menu")
    normalized[cleanKey] = value;

    // Optional: Also allow lookup by just filename without path ("Menu")
    const shortName = cleanKey.split("/").pop();
    if (shortName && !normalized[shortName]) {
      normalized[shortName] = value;
    }
  }

  return normalized;
}

function readAndExpandTemplate(fileName: string): string {
  if (normalizeTemplates(compiledTemplates)[fileName]) {
    return templateCache[fileName];
  }

  // const filePath = path.join(COMPONENT_DIR, fileName);
  // let rawHtml = fs.readFileSync(filePath, "utf8");

  // // Regex matches: {{> partialName.html}} or {{> components/partialName.html}}
  // const partialRegex = /\{\{\>\s*([a-zA-Z0-9_\-\.\/]+)\s*\}\}/g;

  // // Replace each partial tag with the contents of that child file (recursively)
  // rawHtml = rawHtml.replace(partialRegex, (_, partialFileName) => {
  //   return readAndExpandTemplate(partialFileName);
  // });

  // templateCache[fileName] = rawHtml;
  // return rawHtml;
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

export const saveChache = () => {
  fs.writeFileSync("./templateCache.json", JSON.stringify(templateCache));
};
