export interface UserPreferences {
  version: number;
  playlists: Record<string, any>;
  user_subscriptions: any[];
  allowed_bands: any[];
}

/**
 * Reads preferences from localStorage, compresses them with Gzip,
 * and builds a shareable URL containing the encoded payload.
 */
export async function generateExportUrl(): Promise<string> {
  const payload: UserPreferences = {
    version: 1,
    playlists: JSON.parse(localStorage.getItem("playlists") || "{}"),
    user_subscriptions: JSON.parse(
      localStorage.getItem("user_subscriptions") || "[]",
    ),
    allowed_bands: JSON.parse(localStorage.getItem("allowed_bands") || "[]"),
  };

  const jsonString = JSON.stringify(payload);
  const jsonBuffer = new TextEncoder().encode(jsonString);

  // Compress payload using native Gzip CompressionStream
  const cs = new CompressionStream("gzip");
  const writer = cs.writable.getWriter();
  writer.write(jsonBuffer);
  writer.close();

  const compressedArrayBuffer = await new Response(cs.readable).arrayBuffer();

  // Convert compressed buffer to URL-safe Base64
  const base64 = bufferToBase64Url(compressedArrayBuffer);

  const baseUrl = window.location.origin + window.location.pathname;
  return `${baseUrl}#import=${base64}`;
}

/**
 * Checks the URL hash for an `#import=` payload, decompresses it,
 * and writes the restored data back into localStorage.
 */
export async function handleUrlImport(): Promise<boolean> {
  const hash = window.location.hash;
  if (!hash.includes("#import=")) return false;

  const base64Data = hash.split("#import=")[1];
  if (!base64Data) return false;

  try {
    const compressedBuffer = base64UrlToBuffer(base64Data);

    // Decompress payload using native DecompressionStream
    const ds = new DecompressionStream("gzip");
    const writer = ds.writable.getWriter();
    writer.write(compressedBuffer);
    writer.close();

    const decompressedArrayBuffer = await new Response(
      ds.readable,
    ).arrayBuffer();
    const jsonString = new TextDecoder().decode(decompressedArrayBuffer);

    const payload: UserPreferences = JSON.parse(jsonString);

    if (payload.playlists) {
      localStorage.setItem("playlists", JSON.stringify(payload.playlists));
    }
    if (payload.user_subscriptions) {
      localStorage.setItem(
        "user_subscriptions",
        JSON.stringify(payload.user_subscriptions),
      );
    }
    if (payload.allowed_bands) {
      localStorage.setItem(
        "allowed_bands",
        JSON.stringify(payload.allowed_bands),
      );
    }

    // Clear hash from address bar without reloading
    history.replaceState(
      null,
      "",
      window.location.pathname + window.location.search,
    );
    return true;
  } catch (err) {
    console.error("Failed to import preferences from URL:", err);
    return false;
  }
}

// Helper: Convert ArrayBuffer to URL-Safe Base64
function bufferToBase64Url(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

// Helper: Convert URL-Safe Base64 back to Uint8Array
function base64UrlToBuffer(base64Url: string): Uint8Array {
  let base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
  while (base64.length % 4) {
    base64 += "=";
  }
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}
