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
    const srcCssDir = join(projectRoot, "src/compiler/css");
    mkdirSync(outputDir, { recursive: true });

    // 1. Compile the main public portfolio styles
    console.log(` -> Processing: ${join(srcCssDir, "main.css")}`);
    const flatMainCss = crossCompileManifest(join(srcCssDir, "main.css"));
    const mainResult = transform({
      filename: "main.css",
      code: Buffer.from(flatMainCss),
      minify: true,
      sourceMap: false,
    });
    writeFileSync(join(outputDir, "main.css"), mainResult.code);

    // 2. Compile the full private review dashboard styles
    const flatStudioCss = crossCompileManifest(
      join(srcCssDir, "review-studio.css"),
    );
    const studioResult = transform({
      filename: "review-studio.css",
      code: Buffer.from(flatStudioCss),
      minify: true,
      sourceMap: false,
    });
    writeFileSync(join(outputDir, "review-studio.css"), studioResult.code);

    console.log(
      "✨ Both production CSS entry points successfully flattened and minified!",
    );
  } catch (error) {
    console.error("❌ CSS Compilation failed:", error);
    throw error;
  }
}
