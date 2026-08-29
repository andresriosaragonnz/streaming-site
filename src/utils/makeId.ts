// Matches your Rust alphabet: 0-9, a-z, A-Z (lowercase first!)
const BASE62_ALPHABET =
  "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";

export const hashNameToId = (name: string): string => {
  const cleanName = name.toLowerCase().trim();
  const limit = Math.min(cleanName.length, 150);

  // Encode string as UTF-8 bytes to match Rust's .as_bytes()
  const bytes = new TextEncoder().encode(cleanName.slice(0, limit));

  // FNV-1a 32-bit Hash
  let hash = 2166136261;
  for (let i = 0; i < bytes.length; i++) {
    hash ^= bytes[i];
    // Replicate Rust's u32 wrapping multiplication
    hash = Math.imul(hash, 16777619) >>> 0;
  }

  if (hash === 0) {
    return "00000";
  }

  let num = hash;
  const resultBytes: string[] = [];

  while (num > 0) {
    const rem = num % 62;
    resultBytes.push(BASE62_ALPHABET[rem]);
    num = Math.floor(num / 62);
  }

  resultBytes.reverse();
  const result = resultBytes.join("");

  return result.padStart(5, "0");
};
