import { build } from "bun";

const result = await build({
  entrypoints: [
    "src/ts/privateApp.ts",
    "src/ts/publicApp.ts",
    "src/ts/portfolioApp.ts",
    "src/ts/playlistPortfolioApp.ts",
    "src/ts/playlistApp.ts",
  ],
  outdir: "./public/js",
  minify: true,
  target: "browser",
});

if (!result.success) {
  console.error("Build failed:", result.logs);
  process.exit(1);
} else {
  console.log("⚡ [Bun] All client JS bundles compiled successfully.");
}
