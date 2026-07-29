import { registerCarousel } from "./utils/carousel.js";
import { initAlpineStores } from "./stores/publicStore.js";

document.addEventListener("alpine:init", () => {
  const Alpine = window.Alpine;

  registerCarousel(Alpine);
  initAlpineStores(Alpine);
});

// Boot script loader for media engine & Alpine
const mediaEngineScript = document.createElement("script");
mediaEngineScript.src = "/js/mediaInit.js";

mediaEngineScript.onload = () => {
  console.log(
    "⚡ Option B Media Engine loaded. Booting Alpine wrapper next...",
  );
  const script = document.createElement("script");
  script.src = "/js/alpine.js";
  script.defer = true;
  document.head.appendChild(script);
};

document.head.appendChild(mediaEngineScript);
