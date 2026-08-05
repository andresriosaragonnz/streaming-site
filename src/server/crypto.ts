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

  if (!isValid) return null;

  try {
    return JSON.parse(base64urlDecode(encodedPayload)) as T;
  } catch {
    return null;
  }
}
