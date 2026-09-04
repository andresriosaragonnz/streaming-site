import { Menu } from "../../components/Menu";
import { Toast } from "../../components/ToastContainer";

export const PlaylistPortfolioLayout = () => {
  return (
    <html lang="en">
      <head>
        <link
          rel="icon"
          type="image/png"
          href="/favicon-96x96.png"
          sizes="96x96"
        />
        <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
        <link rel="shortcut icon" href="/favicon.ico" />
        <link
          rel="apple-touch-icon"
          sizes="180x180"
          href="/apple-touch-icon.png"
        />
        <link rel="manifest" href="/site.webmanifest" />
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>My Playlists</title>
        <link rel="stylesheet" href="/css/main.css" />
      </head>
      <body>
        <Toast />
        <div class="menu-container">
          <Menu />
        </div>

        {/* Hero Banner Container */}
        <div
          id="portfolio-hero-container"
          data-bind-class="portfolio.isLoading ? 'hero-container is-loading' : 'hero-container'"
        >
          {/* Skeleton or dynamic inner HTML will be swapped here */}
          <div class="hero-placeholder">Loading your playlists...</div>
        </div>

        {/* Performance Cards Grid Container */}
        <main
          class="performance-grid"
          id="performance-grid"
          data-bind-class="portfolio.isLoading ? 'performance-grid is-loading' : 'performance-grid'"
        >
          {/* Rendered cards will be injected here */}
        </main>

        <script type="module" src="/js/playlistPortfolioApp.js"></script>
      </body>
    </html>
  );
};
