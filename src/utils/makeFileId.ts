import { createHash } from "node:crypto";

export function generateIdFromFilename(filename: string): string {
  const base64Hash = createHash("md5")
    .update(filename, "utf8")
    .digest("base64");

  return base64Hash.replace(/[^A-Za-z0-9]/g, "").slice(0, 9);
}

const filename = "emergency_awesome-big_fan-20259623-segment_0";
const shortId = generateIdFromFilename(filename);

console.log(`Filename: ${filename}`);
console.log(`Hash ID:  ${shortId}`);
