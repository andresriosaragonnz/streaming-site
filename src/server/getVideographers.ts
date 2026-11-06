import { decryptVideographerConfig } from "./crypto";

/**
 * Generates a URL-safe HMAC-SHA256 media token in the form
 * `${expires}.${signature}`. The signed message is `${id}:${expires}` and must
 * match the media Worker's verification message exactly.
 */
export async function generateSegmentToken(
  id: string,
  secret: string,
  expiresInSeconds = 7200, // 2 hours default
): Promise<string> {
  if (!secret) {
    throw new Error("Missing media signing secret");
  }

  const expires = Math.floor(Date.now() / 1000) + expiresInSeconds;
  const message = `${id}:${expires}`;
  const enc = new TextEncoder();

  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );

  const signatureBuffer = await crypto.subtle.sign(
    "HMAC",
    key,
    enc.encode(message),
  );

  const signatureBase64 = btoa(
    String.fromCharCode(...new Uint8Array(signatureBuffer)),
  )
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");

  return `${expires}.${signatureBase64}`;
}

export const getVideographers = async (c: any) => {
  const { results } = await c.env.DB.prepare(
    `SELECT * FROM videographers`,
  ).all();

  const videographers = {} as any;

  for (const videographer of results) {
    const { storageKey, worker } = await decryptVideographerConfig(
      videographer.encrypted_credentials,
      videographer.iv,
      c.env.MASTER_ENCRYPTION_KEY,
    );

    const segmentToken = await generateSegmentToken(
      videographer.name,
      storageKey,
    );

    videographers[videographer.name] = {
      segmentToken,
      name: videographer.name,
      worker,
    };
  }

  return videographers;
};

/**
 * Resolves the signing config for one videographer without exposing it to
 * template data. Used by the authenticated master-download endpoint.
 */
export const getVideographerSigningConfig = async (
  c: any,
  name: string,
): Promise<{ name: string; worker: string; storageKey: string } | null> => {
  const row = await c.env.DB.prepare(
    `SELECT * FROM videographers WHERE name = ? LIMIT 1`,
  )
    .bind(name)
    .first();

  if (!row) return null;

  const { storageKey, worker } = await decryptVideographerConfig(
    row.encrypted_credentials,
    row.iv,
    c.env.MASTER_ENCRYPTION_KEY,
  );

  return { name: row.name, worker, storageKey };
};
