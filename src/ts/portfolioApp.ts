import { UI } from "./binder.js";
import { createPlaylistStore } from "./stores/playlistStore.js";
import { createGraphStore } from "./stores/graphStore.js";
import { initCarouselScroll } from "./utils/carousel.js";
import * as playlistUtils from "./utils/playlistUtils.js";

// 1. Extend Window interface for clean TS definitions
declare global {
  interface Window {
    playlistStore: ReturnType<typeof createPlaylistStore>;
    graphStore: ReturnType<typeof createGraphStore>;
    playlistUtils: typeof playlistUtils;
  }
}

// 2. Expose utility functions globally for inline HTML event handlers
window.playlistUtils = playlistUtils;

// 3. Handle redirects based on query parameters
playlistUtils.handleMyPlaylistsRedirect();

// 4. Initialize DOM components & hydrate stores
const initPortfolioApp = () => {
  // Initialize carousel controls
  initCarouselScroll();

  // Instantiate global reactive stores
  window.playlistStore = createPlaylistStore();
  window.graphStore = createGraphStore();

  // Wire store event dispatches directly to the UI binder
  window.addEventListener("playlist-state-changed", () => UI.requestSync());
  window.addEventListener("graph-state-changed", () => UI.requestSync());

  // Force an initial sync pass now that stores are hydrated on window
  UI.requestSync();
};

// 5. Execution entry point
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initPortfolioApp);
} else {
  initPortfolioApp();
}
