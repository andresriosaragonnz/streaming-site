// scripts/sync-local-r2.ts
import { readdirSync, statSync } from "fs";
import { join, relative } from "path";
import { execSync } from "child_process";

// UPDATE THIS to point to your local video build directory
const LOCAL_MEDIA_DIR = "./path/to/your/video/output";
const BUCKET_NAME = "dev-media-bucket";

function getAllFiles(dirPath: string, arrayOfFiles: string[] = []) {
  const files = readdirSync(dirPath);

  files.forEach((file) => {
    const fullPath = join(dirPath, file);
    if (statSync(fullPath).isDirectory()) {
      arrayOfFiles = getAllFiles(fullPath, arrayOfFiles);
    } else {
      arrayOfFiles.push(fullPath);
    }
  });

  return arrayOfFiles;
}

console.log("Syncing local video files to Wrangler R2 local emulator...");

const allFiles = getAllFiles(LOCAL_MEDIA_DIR);

for (const filePath of allFiles) {
  // Get relative path to maintain folder structure (e.g., aidan_ripley-ding_dong_lounge-20260109/output.m3u8)
  const r2Key = relative(LOCAL_MEDIA_DIR, filePath).replace(/\\/g, "/");

  console.log(`Uploading: ${r2Key}`);

  // Uses Wrangler's local flag to write to .wrangler/state/v3/r2
  execSync(
    `bun x wrangler r2 object put ${BUCKET_NAME}/${r2Key} --file="${filePath}" --local`,
    { stdio: "inherit" },
  );
}

console.log("Local R2 bucket fully synced!");
