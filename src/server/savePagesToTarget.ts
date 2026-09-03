import type { Env, RenderedPage } from "./types";

export const devMemoryCache = new Map<string, string>();
const devHashCache = new Map<string, string>();

/**
 * Computes a hex SHA-256 hash using Web Crypto.
 */
async function computeSHA256(content: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(content);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

export const savePagesToTarget = async (env: Env, pages: RenderedPage[]) => {
  if (pages.length === 0) return;

  const isDev = process.env.NODE_ENV === "development";

  // ---------------------------------------------------------------------------
  // 1. Localhost Dev Path (In-Memory Map with Hash Diffing)
  // ---------------------------------------------------------------------------
  if (isDev) {
    let devWrittenCount = 0;

    await Promise.all(
      pages.map(async (page) => {
        const newHash = await computeSHA256(page.value);
        const existingHash = devHashCache.get(page.key);

        if (existingHash !== newHash) {
          devHashCache.set(page.key, newHash);
          devMemoryCache.set(page.key, page.value);
          devWrittenCount++;
        }
      }),
    );

    console.log(
      `💾 [Dev Cache] ${devWrittenCount}/${pages.length} pages updated in memory.`,
    );
    return;
  }

  // ---------------------------------------------------------------------------
  // 2. Production Path: Bounded Parallel R2 head() Checks + R2 Write Pipeline
  // ---------------------------------------------------------------------------
  const bucket = env.STATIC_BUCKET as any;
  const CHUNK_SIZE = 50; // Max concurrent HTTP socket connections per batch
  const changedPages: { page: RenderedPage; hash: string }[] = [];

  // Parallel head() metadata inspection in bounded chunks
  for (let i = 0; i < pages.length; i += CHUNK_SIZE) {
    const chunk = pages.slice(i, i + CHUNK_SIZE);

    const checkResults = await Promise.all(
      chunk.map(async (page) => {
        const newHash = await computeSHA256(page.value);
        const head = await bucket.head(page.key);
        const existingHash = head?.customMetadata?.sha256;

        if (!existingHash || existingHash !== newHash) {
          return { page, hash: newHash };
        }
        return null;
      }),
    );

    for (let j = 0; j < checkResults.length; j++) {
      const res = checkResults[j];
      if (res) changedPages.push(res);
    }
  }

  if (changedPages.length === 0) {
    console.log(
      `✨ [R2 Cache] All ${pages.length} pages up to date. 0 writes needed.`,
    );
    return;
  }

  // Bounded parallel put() saves for changed pages
  let prodWrittenCount = 0;
  for (let i = 0; i < changedPages.length; i += CHUNK_SIZE) {
    const chunk = changedPages.slice(i, i + CHUNK_SIZE);

    await Promise.all(
      chunk.map(async ({ page, hash }) => {
        await bucket.put(page.key, page.value, {
          httpMetadata: {
            contentType: "text/html; charset=utf-8",
          },
          customMetadata: {
            sha256: hash,
          },
        });
        prodWrittenCount++;
      }),
    );
  }

  console.log(
    `💾 [R2 Cache] Wrote ${prodWrittenCount}/${pages.length} modified pages to R2.`,
  );
};
