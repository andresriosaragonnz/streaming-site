import { registerCarousel } from "./utils/carousel.js";
import { initAlpineStores } from "./stores/publicStore.js";
import { initPlaylistStore } from "./stores/playlistStore.js";
import { initFollowStore } from "./stores/followStore.js";
import { initToastStore } from "./stores/toastStore.js";
import { initPlayerStore } from "./stores/playerStore.js";
import { clearSearchParams } from "./utils/playlistUtils";

function bootAlpine() {
  const Alpine = (window as any).Alpine;
  if (!Alpine) return;

  // Prevent double registration if already booted
  if ((window as any).__alpineBooted) return;
  (window as any).__alpineBooted = true;
  clearSearchParams();
  registerCarousel(Alpine);
  initPlayerStore(Alpine);
  initAlpineStores(Alpine);
  initPlaylistStore(Alpine);
  initFollowStore(Alpine);
  initToastStore(Alpine);
  console.log("🚀 Alpine stores successfully registered.");
}

// Listen for standard init event
document.addEventListener("alpine:init", bootAlpine);

// Dynamically load media engine -> then Alpine
const mediaEngineScript = document.createElement("script");
mediaEngineScript.src = "/js/mediaInit.js";

mediaEngineScript.onload = () => {
  const alpineScript = document.createElement("script");
  alpineScript.src = "/js/alpine.js";

  // Boot stores explicitly as soon as alpine.js loads
  alpineScript.onload = () => {
    bootAlpine();
  };

  document.head.appendChild(alpineScript);
};

document.head.appendChild(mediaEngineScript);
