// src/build/compilers/css.ts
import { transform } from "lightningcss";
import { writeFileSync, mkdirSync, readFileSync } from "fs";
import { join, resolve } from "path";

/**
 * Enhanced cross-compiler that sanitizes imports, trims hidden whitespace strings,
 * and absolute-resolves paths directly from the project frame.
 */
function crossCompileManifest(entryPath: string): string {
  // Ensure the entry file path itself is fully resolved and absolute
  const absoluteEntryPath = resolve(entryPath);
  const fileContent = readFileSync(absoluteEntryPath, "utf8");
  const baseDir = join(absoluteEntryPath, "..");

  // Match: @import "./path/file.css"; with extra spaces or carriage returns handled safely
  return fileContent.replace(
    /@import\s+['"]([^'"]+)['"]\s*;/g,
    (_, importPath) => {
      // Trim trailing/leading space markers or carriage tokens hidden inside string boundaries
      const cleanImportPath = importPath.trim();
      const absoluteImportPath = resolve(join(baseDir, cleanImportPath));

      // Recursively resolve down the partial tree dependencies
      return crossCompileManifest(absoluteImportPath);
    },
  );
}

export function compileStylesheets(): void {
  try {
    console.log(
      "🎨 Compiling and minifying public stylesheets via asset flattener...",
    );

    // Explicitly ground paths relative to where this exact compiler module script lives
    const projectRoot = resolve(join(__dirname, "../.."));
    const outputDir = join(projectRoot, "public/css");
    const srcCssDir = join(projectRoot, "src/css");
    mkdirSync(outputDir, { recursive: true });

    // Shared base + page layers. Every page loads app.css plus at most one
    // page layer (public pages may also load review-studio.css for the
    // shared sidebar/playlist UI).
    const entries = ["app.css", "main.css", "review-studio.css", "status.css"];

    for (const entry of entries) {
      console.log(` -> Processing: ${join(srcCssDir, entry)}`);
      const flatCss = crossCompileManifest(join(srcCssDir, entry));
      const result = transform({
        filename: entry,
        code: Buffer.from(flatCss),
        minify: true,
        sourceMap: false,
      });
      writeFileSync(join(outputDir, entry), result.code);
    }

    console.log("✨ All production CSS entry points flattened and minified!");
  } catch (error) {
    console.error("❌ CSS Compilation failed:", error);
    throw error;
  }
}

compileStylesheets();
