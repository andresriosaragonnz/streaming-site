import { createHash } from "node:crypto";

export const generateDeterministicId = (seedString: any) => {
  // Standard 64-character NanoID alphabet
  const alphabet =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789_-";

  // Produce a SHA-256 byte buffer
  const hashBuffer = createHash("sha256").update(seedString).digest();

  // Map 9 bytes from the hash onto the NanoID alphabet
  let id = "";
  for (let i = 0; i < 9; i++) {
    id += alphabet[hashBuffer[i] % alphabet.length];
  }

  return id;
};
