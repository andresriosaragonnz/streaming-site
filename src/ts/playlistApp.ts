import { UI } from "./binder.js";
import { createPlayerStore } from "./stores/playerStore.js";
import { createPlaylistStore } from "./stores/playlistStore.js";
import { initCarouselScroll } from "./utils/carousel.js";
import { PlaylistDragEngine } from "./utils/playlistDrag.js";
import { initToastListener } from "./utils/toastUtils.js";

declare global {
  interface Window {
    playerStore: ReturnType<typeof createPlayerStore>;
    playlistStore: ReturnType<typeof createPlaylistStore>;
    playlistDragEngine: PlaylistDragEngine;
    setupMediaPlayback?: (segment: any, mode: boolean, paused: boolean) => void;
  }
}

// Instantiate drag engine on window immediately
window.playlistDragEngine = new PlaylistDragEngine();

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => initCarouselScroll());
} else {
  initCarouselScroll();
}

const mediaEngineScript = document.createElement("script");
mediaEngineScript.src = "/js/mediaInit.js";

mediaEngineScript.onload = () => {
  initToastListener();

  const segmentsDataEl = document.getElementById("studio-segments-data");
  let initialSegments: any[] = [];

  if (segmentsDataEl && segmentsDataEl.textContent) {
    try {
      initialSegments = JSON.parse(segmentsDataEl.textContent);
    } catch (err) {
      console.error("Failed to parse #studio-segments-data JSON:", err);
    }
  }

  // Instantiate remaining active stores
  window.playerStore = createPlayerStore(initialSegments);
  window.playlistStore = createPlaylistStore();

  window.addEventListener("player-track-changed", () => UI.requestSync());
  window.addEventListener("playlist-state-changed", () => UI.requestSync());

  UI.requestSync();

  if (window.playerStore?.active?.id) {
    window.playerStore.selectSegment(0);
  }
};

mediaEngineScript.onerror = () => {
  console.error("Failed to load /js/mediaInit.js engine script.");
};

document.head.appendChild(mediaEngineScript);
