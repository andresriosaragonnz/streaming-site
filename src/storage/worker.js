const ALLOWED_ORIGIN = "https://iknowthatband.org";

const MIME_TYPES = {
  mp3: "audio/mpeg",
  m3u8: "application/x-mpegURL",
  ts: "video/MP2T",
  mp4: "video/mp4",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
};

export default {
  async fetch(request, env) {
    // Handle CORS preflight options request
    if (request.method === "OPTIONS") {
      return new Response(null, {
        headers: {
          "Access-Control-Allow-Origin": ALLOWED_ORIGIN,
          "Access-Control-Allow-Methods": "GET, HEAD, OPTIONS",
          "Access-Control-Allow-Headers": "*",
        },
      });
    }

    const url = new URL(request.url);
    const referer = request.headers.get("referer") || "noref";

    // 1. Check Referer header
    if (!referer.startsWith(ALLOWED_ORIGIN)) {
      return new Response("Forbidden: Invalid Origin", { status: 403 });
    }

    // 2. Extract token from query params (?token=expires.signature)
    const token = url.searchParams.get("token");
    if (!token) {
      return new Response("Forbidden: Missing Auth Token", { status: 403 });
    }

    const [expStr, signature] = token.split(".");
    const expires = parseInt(expStr, 10);

    // 3. Check token expiration
    if (isNaN(expires) || Math.floor(Date.now() / 1000) > expires) {
      return new Response("Forbidden: Token Expired", { status: 403 });
    }

    // 4. Sanitize object key (handles leading //)
    const objectKey = url.pathname.replace(/^\/+/, "");
    if (!objectKey) {
      return new Response("Not Found", { status: 404 });
    }

    // 5. Verify HMAC-SHA256 signature against env.VIDEOGRAPHER_NAME
    const isValid = await verifyHmac(
      env.PLATFORM_SECRET,
      `${env.VIDEOGRAPHER_NAME}:${expires}`,
      signature,
    );

    if (!isValid) {
      return new Response("Forbidden: Invalid Token Signature", {
        status: 403,
      });
    }

    // 6. Fetch object directly from R2 bucket
    const object = await env.VIDEOGRAPHER_BUCKET.get(objectKey);
    if (!object) {
      return new Response("Not Found", { status: 404 });
    }

    const headers = new Headers();
    object.writeHttpMetadata(headers);

    // Set fallback Content-Type if R2 metadata is absent
    const ext = objectKey.split(".").pop()?.toLowerCase();
    if (!headers.has("content-type") && ext && MIME_TYPES[ext]) {
      headers.set("Content-Type", MIME_TYPES[ext]);
    }

    headers.set("etag", object.httpEtag);
    headers.set("Access-Control-Allow-Origin", ALLOWED_ORIGIN);
    headers.set("Accept-Ranges", "bytes");

    // Handle direct master video downloads vs standard asset streaming
    const isDownload = url.searchParams.get("download") === "1";
    if (isDownload) {
      const filename = objectKey.split("/").pop() || "master.mp4";
      headers.set("Content-Disposition", `attachment; filename="${filename}"`);
    }

    if (request.method === "HEAD") {
      return new Response(null, { headers });
    }

    // 7. Intercept HLS .m3u8 manifests and append token to relative chunk URLs (.ts)
    if (objectKey.endsWith(".m3u8")) {
      const originalText = await object.text();
      const tokenQuery = `token=${encodeURIComponent(token)}`;

      // Rewrites chunk lines (e.g., segment_1080_000.ts -> segment_1080_000.ts?token=...)
      // Also handles sub-manifest playlists if using a master playlist setup
      const rewrittenText = originalText.replace(
        /^([^#\s]+\.(?:ts|m3u8))(?:\?.*)?$/gm,
        (match, path) => `${path}?${tokenQuery}`,
      );

      headers.set("Content-Type", "application/x-mpegURL");
      headers.set("Cache-Control", "no-cache, no-store, must-revalidate");

      return new Response(rewrittenText, { headers });
    }

    headers.set("Cache-Control", "public, max-age=31536000, immutable");
    return new Response(object.body, { headers });
  },
};

/**
 * Web Crypto HMAC verification helper.
 */
async function verifyHmac(secret, data, signatureBase64) {
  if (!secret) {
    console.error(
      "PLATFORM_SECRET is missing or empty in Worker environment variables.",
    );
    return false;
  }

  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );

  const expectedBuffer = await crypto.subtle.sign(
    "HMAC",
    key,
    enc.encode(data),
  );

  const expectedBase64 = btoa(
    String.fromCharCode(...new Uint8Array(expectedBuffer)),
  )
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");

  return expectedBase64 === signatureBase64;
}
