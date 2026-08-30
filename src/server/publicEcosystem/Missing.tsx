export interface NotFoundPageLayoutProps {}

export const NotFoundPageLayout = () => (
  <html lang="en">
    <head>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>Live Archive</title>
      <link rel="stylesheet" href="/css/main.css" />
    </head>
    <body>
      <div
        class="artist-hero"
        style='background-image: linear-gradient(rgba(4, 7, 20, 0.2), rgba(4, 7, 20, 1)), url("/index.jpg");'
      >
        <div class="hero-overlay">
          <a href="/" class="btn-back">
            ← Back to Archive
          </a>
          <h1 class="capitalize-words">Artist not found</h1>
        </div>
      </div>

      <script src="/js/prefetch.js" defer></script>
    </body>
  </html>
);
