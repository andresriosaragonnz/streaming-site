import fs from "fs";
import path from "path";

const templateCache: Record<string, string> = {};

export function loadComponent<T extends object>(fileName: string) {
  if (!templateCache[fileName]) {
    // Bun perfectly supports import.meta.dir natively
    const filePath = path.join(process.cwd(), "/src/build/compiler/", fileName);
    templateCache[fileName] = fs.readFileSync(filePath, "utf8");
  }

  return function renderComponent(props: T): string {
    let html = templateCache[fileName];

    for (const [key, value] of Object.entries(props)) {
      html = html.split(`{{${key}}}`).join(String(value));
    }

    return html;
  };
}
