const PROD_ORIGIN = "https://iknowthatband.org";

export default {
  async fetch(request, env) {
    const referer = request.headers.get("referer") || "";

    // 1. Validate Origin (Prod + Local Dev Subnets)
    const isAllowedOrigin =
      referer.startsWith(PROD_ORIGIN) ||
      referer.startsWith("http://localhost:") ||
      referer.startsWith("http://127.0.0.1:") ||
      /^http:\/\/192\.168\.\d{1,3}\.\d{1,3}(:\d+)?\//.test(referer);

    // Extract Origin header for CORS response
    let corsOrigin = PROD_ORIGIN;
    if (referer) {
      try {
        corsOrigin = new URL(referer).origin;
      } catch (e) {}
    }

    // Handle CORS preflight
    if (request.method === "OPTIONS") {
      return new Response(null, {
        headers: {
          "Access-Control-Allow-Origin": corsOrigin,
          "Access-Control-Allow-Methods": "GET, HEAD, OPTIONS",
          "Access-Control-Allow-Headers": "*",
        },
      });
    }

    if (!isAllowedOrigin) {
      return new Response("Forbidden: Invalid Origin", { status: 403 });
    }

    // 2. Extract token from query params (?token=expires.signature)
    const url = new URL(request.url);
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

    // 4. Sanitize object key and extract segment ID (handles leading //)
    const objectKey = url.pathname.replace(/^\/+/, "");
    if (!objectKey) {
      return new Response("Not Found", { status: 404 });
    }

    // Extracts "j7d04" from "j7d04/audio.mp3"
    const segmentId = objectKey.split("/")[0];

    // 5. Verify HMAC-SHA256 signature against segmentId
    const isValid = await verifyHmac(
      env.PLATFORM_SECRET,
      `${segmentId}:${expires}`,
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
    headers.set("etag", object.httpEtag);
    headers.set("Access-Control-Allow-Origin", corsOrigin);

    // Handle direct master video downloads vs standard streaming
    const isDownload = url.searchParams.get("download") === "1";
    if (isDownload) {
      const filename = objectKey.split("/").pop() || "master.mp4";
      headers.set("Content-Disposition", `attachment; filename="${filename}"`);
    } else {
      headers.set("Cache-Control", "public, max-age=31536000, immutable");
    }

    return new Response(object.body, { headers });
  },
};

/**
 * Web Crypto HMAC verification helper.
 */
async function verifyHmac(secret, data, signatureBase64) {
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
