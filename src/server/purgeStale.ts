export interface PurgeResult {
  deletedKvKeys: string[];
  deletedR2Keys: string[];
}

/**
 * Deletes all items from KV and R2 that are NOT present in `validKeys`.
 * Processes deletions in chunks of 100 to stay within payload limits.
 */
export async function purgeStalePages(
  validKeys: string[],
  kv: KVNamespace,
  r2: R2Bucket,
): Promise<PurgeResult> {
  const activeKeysSet = new Set(validKeys);
  const deletedKvKeys: string[] = [];
  const deletedR2Keys: string[] = [];
  const BATCH_SIZE = 100;

  // ---------------------------------------------------------------------------
  // 1. Purge Stale KV Entries (Batched in 100s)
  // ---------------------------------------------------------------------------
  let kvCursor: string | undefined = undefined;

  do {
    const listResult = await kv.list({ cursor: kvCursor });

    const staleKvKeys = listResult.keys
      .map((k) => k.name)
      .filter((key) => !activeKeysSet.has(key));

    // Process KV deletions in chunks of 100
    for (let i = 0; i < staleKvKeys.length; i += BATCH_SIZE) {
      const chunk = staleKvKeys.slice(i, i + BATCH_SIZE);
      await Promise.all(
        chunk.map(async (key) => {
          await kv.delete(key);
          deletedKvKeys.push(key);
        }),
      );
    }

    kvCursor = listResult.list_complete ? undefined : listResult.cursor;
  } while (kvCursor);

  // ---------------------------------------------------------------------------
  // 2. Purge Stale R2 Bucket Entries (Batched in 100s)
  // ---------------------------------------------------------------------------
  let r2Cursor: string | undefined = undefined;

  do {
    const r2Objects = await r2.list({ cursor: r2Cursor });

    const staleR2Keys = r2Objects.objects
      .map((obj) => obj.key)
      .filter((key) => {
        const cleanKey = key.replace(/\.html$/, "");
        return !activeKeysSet.has(cleanKey) && !activeKeysSet.has(key);
      });

    // Process R2 batch deletions in chunks of 100
    for (let i = 0; i < staleR2Keys.length; i += BATCH_SIZE) {
      const chunk = staleR2Keys.slice(i, i + BATCH_SIZE);
      await r2.delete(chunk);
      deletedR2Keys.push(...chunk);
    }

    r2Cursor = r2Objects.truncated ? r2Objects.cursor : undefined;
  } while (r2Cursor);

  console.log(
    `🧹 [Purge Complete] Removed ${deletedKvKeys.length} KV keys and ${deletedR2Keys.length} R2 objects.`,
  );

  return {
    deletedKvKeys,
    deletedR2Keys,
  };
}
