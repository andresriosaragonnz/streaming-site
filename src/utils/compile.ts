import fs from "node:fs";
import path from "node:path";

const templateCache: Record<string, string> = {};
const COMPONENT_DIR = path.join(process.cwd(), "src/build/compiler");

export const readAndExpandTemplate = (fileName: string): string => {
  const filePath = path.join(COMPONENT_DIR, fileName);
  let rawHtml = fs.readFileSync(filePath, "utf8");
  const partialRegex = /\{\{\>\s*([a-zA-Z0-9_\-\.\/]+)\s*\}\}/g;
  rawHtml = rawHtml.replace(partialRegex, (_, partialFileName) => {
    return readAndExpandTemplate(partialFileName);
  });
  templateCache[fileName] = rawHtml;
  return rawHtml;
};

export const compilePage = (html: string, props: any): string => {
  // Direct string replacement for props
  for (const [key, value] of Object.entries(props)) {
    html = html.split(`{{${key}}}`).join(String(value ?? ""));
  }

  return html;
};

export const saveChache = () => {
  fs.writeFileSync("./templateCache.json", JSON.stringify(templateCache));
};
