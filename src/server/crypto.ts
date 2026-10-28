// Helper functions for Base64URL encoding/decoding
function base64urlEncode(str: string): string {
  return btoa(str).replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
}

function base64urlDecode(str: string): string {
  str = str.replace(/-/g, "+").replace(/_/g, "/");
  while (str.length % 4) str += "=";
  return atob(str);
}

// Convert string to Uint8Array
const encoder = new TextEncoder();

async function getCryptoKey(secret: string): Promise<CryptoKey> {
  return await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"],
  );
}

// Sign a payload and return a JWT-style token (HEADER.PAYLOAD.SIGNATURE)
export async function createAuthToken(
  payload: object,
  secret: string,
): Promise<string> {
  const header = { alg: "HS256", typ: "JWT" };
  const encodedHeader = base64urlEncode(JSON.stringify(header));
  const encodedPayload = base64urlEncode(JSON.stringify(payload));

  const dataToSign = `${encodedHeader}.${encodedPayload}`;
  const key = await getCryptoKey(secret);

  const signature = await crypto.subtle.sign(
    "HMAC",
    key,
    encoder.encode(dataToSign),
  );

  const encodedSignature = base64urlEncode(
    String.fromCharCode(...new Uint8Array(signature)),
  );

  return `${dataToSign}.${encodedSignature}`;
}

// Verify signature and return payload if valid
export async function verifyAuthToken<T = any>(
  token: string,
  secret: string,
): Promise<T | null> {
  if (!token) return null;
  const parts = token.split(".");
  if (parts.length !== 3) return null;

  const [encodedHeader, encodedPayload, encodedSignature] = parts;
  const dataToVerify = `${encodedHeader}.${encodedPayload}`;
  const key = await getCryptoKey(secret);

  // Convert signature back to ArrayBuffer
  const binarySignature = base64urlDecode(encodedSignature);
  const signatureBuffer = new Uint8Array(binarySignature.length);
  for (let i = 0; i < binarySignature.length; i++) {
    signatureBuffer[i] = binarySignature.charCodeAt(i);
  }
  const isValid = await crypto.subtle.verify(
    "HMAC",
    key,
    signatureBuffer,
    encoder.encode(dataToVerify),
  );
  console.log({ isValid });
  if (!isValid) return null;

  try {
    return JSON.parse(base64urlDecode(encodedPayload)) as T;
  } catch {
    return null;
  }
}

/* ==========================================================================
   Videographer Credentials AES-GCM Encryption / Decryption
   ========================================================================== */

export interface VideographerConfig {
  accountId: string;
  accessKeyId: string;
  secretAccessKey: string;
  bucketName: string;
}

// Derive a 256-bit AES-GCM CryptoKey from your master secret
async function getMasterKey(masterSecret: string): Promise<CryptoKey> {
  const keyData = encoder.encode(masterSecret);
  const hash = await crypto.subtle.digest("SHA-256", keyData);
  return crypto.subtle.importKey("raw", hash, { name: "AES-GCM" }, false, [
    "encrypt",
    "decrypt",
  ]);
}

// Encrypt full VideographerConfig object into a Base64 string + IV
export async function encryptVideographerConfig(
  config: VideographerConfig,
  masterSecret: string,
): Promise<{ encryptedCredentials: string; iv: string }> {
  const key = await getMasterKey(masterSecret);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const jsonString = JSON.stringify(config);

  const encrypted = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    encoder.encode(jsonString),
  );

  return {
    encryptedCredentials: Buffer.from(encrypted).toString("base64"),
    iv: Buffer.from(iv).toString("base64"),
  };
}

// Decrypt encrypted Base64 string back into VideographerConfig object
export async function decryptVideographerConfig(
  encryptedBase64: string,
  ivBase64: string,
  masterSecret: string,
): Promise<VideographerConfig> {
  const key = await getMasterKey(masterSecret);
  const encrypted = Buffer.from(encryptedBase64, "base64");
  const iv = Buffer.from(ivBase64, "base64");

  const decrypted = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv },
    key,
    encrypted,
  );

  const jsonString = new TextDecoder().decode(decrypted);
  return JSON.parse(jsonString) as VideographerConfig;
}
