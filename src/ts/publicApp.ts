// public/js/publicApp.ts
import { UI } from "./binder.js";
import { createPlayerStore } from "./stores/playerStore.js";
import { createPlaylistStore } from "./stores/playlistStore.js";
import { initCarouselScroll } from "./utils/carousel.js";
import * as playlistUtils from "./utils/playlistUtils.js";
import { initToastListener } from "./utils/toastUtils.js";

(window as any).playlistUtils = playlistUtils;
// 1. Extend Window interface for clean TS types across inline handlers
declare global {
  interface Window {
    playerStore: ReturnType<typeof createPlayerStore>;
    playlistStore: ReturnType<typeof createPlaylistStore>;
    setupMediaPlayback?: (segment: any, mode: boolean, paused: boolean) => void;
  }
}

// 2. Initialize DOM-only components (Carousel) once DOM is ready
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => initCarouselScroll());
} else {
  initCarouselScroll();
}

// 3. Dynamically inject mediaInit.js and hydrate reactive stores
const mediaEngineScript = document.createElement("script");
mediaEngineScript.src = "/js/mediaInit.js";

mediaEngineScript.onload = () => {
  initToastListener();
  // Read static segment JSON embedded by KitaJS
  const segmentsDataEl = document.getElementById("studio-segments-data");
  let initialSegments: any[] = [];

  if (segmentsDataEl && segmentsDataEl.textContent) {
    try {
      initialSegments = JSON.parse(segmentsDataEl.textContent);
    } catch (err) {
      console.error("Failed to parse #studio-segments-data JSON:", err);
    }
  }

  // Instantiate global reactive stores
  window.playerStore = createPlayerStore(initialSegments);
  window.playlistStore = createPlaylistStore();

  const appState = {
    player: window.playerStore,
    playlists: window.playlistStore,
  };

  // Bind reactive store mutations to DOM updates
  UI.bind(appState, "player-track-changed");

  // Load initial segment if available
  if (window.playerStore.active?.id) {
    window.playerStore.selectSegment(0);
  }
};

mediaEngineScript.onerror = () => {
  console.error("Failed to load /js/mediaInit.js engine script.");
};

document.head.appendChild(mediaEngineScript);
