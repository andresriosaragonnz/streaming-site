export const serveSlug = async (c: any) => {
  const slug = c.req.param("slug");

  // Helper function to create HTMLRewriter for random image selection
  const createRandomImageRewriter = () => {
    let selectedImage = "";

    return (
      new HTMLRewriter()
        // 1. Extract array from embedded script tag
        .on("script#page-images", {
          text(textChunk) {
            if (textChunk.text.trim()) {
              try {
                const images = JSON.parse(textChunk.text);
                if (Array.isArray(images) && images.length > 0) {
                  selectedImage =
                    images[Math.floor(Math.random() * images.length)];
                }
              } catch (e) {
                console.error("Failed to parse embedded page-images JSON", e);
              }
            }
          },
        })
        // 2. Dynamically set target elements with chosen responsive image formats
        .on("source#hero-mobile-avif", {
          element(el) {
            if (selectedImage)
              el.setAttribute("srcset", `${selectedImage}/mobile.avif`);
          },
        })
        .on("source#hero-desktop-avif", {
          element(el) {
            if (selectedImage)
              el.setAttribute("srcset", `${selectedImage}/desktop.avif`);
          },
        })
        .on("img#hero-img", {
          element(el) {
            if (selectedImage)
              el.setAttribute("src", `${selectedImage}/desktop.jpg`);
          },
        })
    );
  };

  // Common response headers to prevent caching random selections
  const headers = new Headers({
    "content-type": "text/html; charset=utf-8",
    "cache-control": "no-cache, no-store, must-revalidate",
  });

  // -------------------------------------------------------------
  // 1. LOCAL DEV: Fetch from PAGE_CACHE (KV) & Randomize Image
  // -------------------------------------------------------------
  if (process.env.NODE_ENV === "development") {
    if (c.env.PAGE_CACHE) {
      const cachedHtml = await c.env.PAGE_CACHE.get(slug);
      if (cachedHtml) {
        const rewriter = createRandomImageRewriter();
        const response = new Response(cachedHtml, { status: 200, headers });
        return rewriter.transform(response);
      }
    }
    return c.html("<h1>404 - Page Not Found (Dev KV)</h1>", 404);
  }

  // -------------------------------------------------------------
  // 2. PRODUCTION: Read from R2 Bucket & Randomize Image
  // -------------------------------------------------------------
  if (!c.env.STATIC_BUCKET) {
    return c.text(
      "CRITICAL ERROR: STATIC_BUCKET binding is missing/undefined",
      500,
    );
  }

  const object = await c.env.STATIC_BUCKET.get(slug);

  if (!object) {
    return c.html("<h1>404 - Page Not Found</h1>", 404);
  }

  object.writeHttpMetadata(headers);
  headers.set("content-type", "text/html; charset=utf-8");
  headers.set("cache-control", "no-cache, no-store, must-revalidate");

  const rewriter = createRandomImageRewriter();
  const response = new Response(object.body, { status: 200, headers });

  return rewriter.transform(response);
};
