import { UI } from "./binder.js";
import "./actions.js"; // Registers all data-action handlers
import { initPlayerStore, PlayerStore } from "./stores/playerStore.js";
import { initPlaylistStore, PlaylistStore } from "./stores/playlistStore.js";
import { initToastStore, ToastStore } from "./stores/toastStore.js";
import { initMediaController } from "./utils/mediaController.js";
import { initCarouselScroll } from "./utils/carousel.js";
import { PlaylistDragEngine } from "./utils/playlistDrag.js";

declare global {
  interface Window {
    playerStore?: PlayerStore;
    playlistStore?: PlaylistStore;
    toastStore?: ToastStore;
    playlistDragEngine: PlaylistDragEngine;
  }
}

// 1. Instantiate global drag engine immediately
window.playlistDragEngine = new PlaylistDragEngine();

// 2. Initialize UI layout helpers on DOM load
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => initCarouselScroll());
} else {
  initCarouselScroll();
}

function initApp(): void {
  // Parse server-rendered segment data
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
  const urlParams =
    typeof window !== "undefined"
      ? new URLSearchParams(window.location.search)
      : null;
  const initialPlaylistName = urlParams?.get("name") || "Favorites";

  const playerStore = initPlayerStore(initialSegments);
  playerStore.populatePlaylistDropdown();
  initToastStore();
  initPlaylistStore(initialSegments, initialPlaylistName);

  // Initialize native media element listeners (Audio, Video & Adaptive Quality)
  initMediaController();

  // Initial media sync if segments exist
  if (playerStore.state.segments.length > 0) {
    playerStore.selectSegment(playerStore.state.segments[0].id);
  }

  // Trigger initial binder sync
  UI.requestSync();
  console.log(
    "🚀 [App] App initialized with playerStore, playlistStore, toastStore & mediaController.",
  );
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initApp);
} else {
  initApp();
}
