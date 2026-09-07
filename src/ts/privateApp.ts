import { UI } from "./binder.js";
import "./actions.js"; // Registers all data-action handlers
import { initPlayerStore, PlayerStore } from "./stores/playerStore.js";
import { initReviewStore, ReviewStore } from "./stores/reviewStore.js";
import { initMediaController } from "./utils/mediaController.js";
import { initCarouselScroll } from "./utils/carousel.js";

declare global {
  interface Window {
    playerStore?: PlayerStore;
    reviewStore?: ReviewStore;

    setupMediaPlayback?: (segment: any, mode: boolean, paused: boolean) => void;
  }
}

// 1. Initialize UI layout helpers on DOM load
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => initCarouselScroll());
} else {
  initCarouselScroll();
}

// 2. Load media engine script
const mediaEngineScript = document.createElement("script");
mediaEngineScript.src = "/js/mediaInit.js";

mediaEngineScript.onload = () => {
  // Read server-rendered segment data payload
  const segmentsDataEl = document.getElementById("studio-segments-data");
  let initialSegments: any[] = [];

  if (segmentsDataEl && segmentsDataEl.textContent) {
    try {
      initialSegments = JSON.parse(segmentsDataEl.textContent);
    } catch (err) {
      console.error("Failed to parse #studio-segments-data JSON:", err);
    }
  }

  // Instantiate active reactive stores
  const playerStore = initPlayerStore(initialSegments);
  initReviewStore(initialSegments);

  // Initialize native media element listeners (Audio, Video & Adaptive Quality)
  initMediaController();

  // Initial media sync if segments exist
  if (playerStore.state.segments.length > 0) {
    playerStore.selectSegment(playerStore.state.segments[0].id);
  }

  // Trigger initial binder sync
  UI.requestSync();
  console.log(
    "🚀 [PrivateApp] Initialized with playerStore, reviewStore & mediaController.",
  );
};

mediaEngineScript.onerror = () => {
  console.error("Failed to load /js/mediaInit.js engine script.");
};

document.head.appendChild(mediaEngineScript);
