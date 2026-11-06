import { decryptVideographerConfig } from "./crypto";

/**
 * Fast, synchronous URL-safe Base64 HMAC-SHA256 token generator using Bun primitives.
 */

export async function generateSegmentToken(
  id: string,
  secret: string,
  expiresInSeconds = 7200, // 2 hours default
): Promise<string> {
  const expires = Math.floor(Date.now() / 1000) + expiresInSeconds;
  const message = `${id}:${expires}`;
  console.log({ id, secret });
  const enc = new TextEncoder();
  const keyBuffer = enc.encode(secret);
  const messageBuffer = enc.encode(message);

  const key = await crypto.subtle.importKey(
    "raw",
    keyBuffer,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );

  const signatureBuffer = await crypto.subtle.sign("HMAC", key, messageBuffer);

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
  // Decrypt all credentials in one step
  const videographers = {} as any;

  for (const videographer of results) {
    const { storageKey, worker } = await decryptVideographerConfig(
      videographer.encrypted_credentials,
      videographer.iv,
      c.env.MASTER_ENCRYPTION_KEY,
    );
    console.log({ storageKey });
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
  console.log({ videographers });
  return videographers;
};
