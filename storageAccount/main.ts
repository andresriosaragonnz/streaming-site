const ALLOWED_REFERER = "iknowthatband.org";

export default {
  async fetch(request: Request, env: any): Promise<Response> {
    const url = new URL(request.url);
    const referer = request.headers.get("referer") || "";

    // Allow CORS preflight OPTIONS requests
    if (request.method === "OPTIONS") {
      return new Response(null, {
        headers: {
          "Access-Control-Allow-Origin": `https://${ALLOWED_REFERER}`,
          "Access-Control-Allow-Methods": "GET, HEAD, OPTIONS",
          "Access-Control-Allow-Headers": "*",
        },
      });
    }

    // Enforce Referer header security check
    if (!referer.includes(ALLOWED_REFERER)) {
      return new Response(
        "Forbidden: Direct access or external hotlinking blocked",
        {
          status: 403,
        },
      );
    }

    // Extract R2 key from path
    const objectKey = url.pathname.slice(1);
    if (!objectKey) {
      return new Response("Not Found", { status: 404 });
    }

    // Fetch directly from R2 via native binding (No public HTTP fetch)
    const object = await env.VIDEOGRAPHER_BUCKET.get(objectKey);
    if (!object) {
      return new Response("Object Not Found", { status: 404 });
    }

    // Attach headers and return stream
    const headers = new Headers();
    object.writeHttpMetadata(headers);
    headers.set("etag", object.httpEtag);
    headers.set("Access-Control-Allow-Origin", `https://${ALLOWED_REFERER}`);
    headers.set("Access-Control-Allow-Methods", "GET, HEAD, OPTIONS");
    headers.set("Cache-Control", "public, max-age=31536000, immutable");

    return new Response(object.body, { headers });
  },
};
