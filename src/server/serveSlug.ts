export const serveSlug = async (c: any) => {
  const slug = c.req.param("slug");

  // -------------------------------------------------------------
  // 1. LOCAL DEV: Fetch from ./public/pages/${slug}/index.html
  // -------------------------------------------------------------
  // -------------------------------------------------------------
  if (process.env.NODE_ENV === "development") {
    if (c.env.PAGE_CACHE) {
      const cachedHtml = await c.env.PAGE_CACHE.get(slug);
      if (cachedHtml) {
        return c.html(cachedHtml);
      }
    }
    return c.html("<h1>404 - Page Not Found (Dev KV)</h1>", 404);
  }

  // -------------------------------------------------------------
  // 2. PRODUCTION: Read from R2 Bucket
  // -------------------------------------------------------------
  if (!c.env.STATIC_BUCKET) {
    return c.text(
      "CRITICAL ERROR: STATIC_BUCKET binding is missing/undefined",
      500,
    );
  }
  const object = await c.env.STATIC_BUCKET?.get(slug);

  if (!object) {
    return c.html("<h1>404 - Page Not Found</h1>", 404);
  }
  const headers = new Headers();
  object.writeHttpMetadata(headers);
  headers.set("etag", object.httpEtag);
  headers.set("content-type", "text/html; charset=utf-8");

  return c.body(object.body, 200, Object.fromEntries(headers));
};
