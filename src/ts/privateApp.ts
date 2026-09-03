import { UI } from "./binder.js";
import { createPlayerStore } from "./stores/playerStore.js";
import { createPlaylistStore } from "./stores/playlistStore.js";
import { createReviewStore } from "./stores/privateReviewStore.js";
import { initCarouselScroll } from "./utils/carousel.js";
import * as playlistUtils from "./utils/playlistUtils.js";
import { initToastListener } from "./utils/toastUtils.js";

(window as any).playlistUtils = playlistUtils;

declare global {
  interface Window {
    playerStore: ReturnType<typeof createPlayerStore>;
    playlistStore: ReturnType<typeof createPlaylistStore>;
    reviewStore: ReturnType<typeof createReviewStore>;
    setupMediaPlayback?: (segment: any, mode: boolean, paused: boolean) => void;
  }
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => initCarouselScroll());
} else {
  initCarouselScroll();
}

const mediaEngineScript = document.createElement("script");
mediaEngineScript.src = "/js/mediaInit.js";

mediaEngineScript.onload = () => {
  initToastListener();

  // 1. Read directly from #studio-segments-data
  const segmentsDataEl = document.getElementById("studio-segments-data");
  let initialSegments: any[] = [];

  try {
    if (segmentsDataEl?.textContent) {
      initialSegments = JSON.parse(segmentsDataEl.textContent);
    }
  } catch (e) {
    console.error("Failed to parse #studio-segments-data payload:", e);
  }

  // 2. Map payload properties accurately (status === "public")
  const initialReviewTracks = initialSegments.map((s: any) => ({
    title: s.title || "",
    isPublic: s.status === "public",
    id: s.id,
  }));

  // 3. Instantiate stores with hydrated segments
  window.playerStore = createPlayerStore(initialSegments);
  window.playlistStore = createPlaylistStore();
  window.reviewStore = createReviewStore(initialReviewTracks);

  // 4. Initialize global click delegates & render
  UI.init();
  window.reviewStore.render();
};

mediaEngineScript.onerror = () => {
  console.error("Failed to load /js/mediaInit.js engine script.");
};

document.head.appendChild(mediaEngineScript);
