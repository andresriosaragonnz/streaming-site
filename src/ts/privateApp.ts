import { registerCarousel } from "./utils/carousel.js";
import { initPrivateAlpineStores } from "./stores/privateReviewStore.js";

document.addEventListener("alpine:init", () => {
  const Alpine = window.Alpine;
  registerCarousel(Alpine);
  initPrivateAlpineStores(Alpine);
});

// Boot script loader for media engine & Alpine
const mediaEngineScript = document.createElement("script");
mediaEngineScript.src = "/js/mediaInit.js";

mediaEngineScript.onload = () => {
  const script = document.createElement("script");
  script.src = "/js/alpine.js";
  script.defer = true;
  document.head.appendChild(script);
};

document.head.appendChild(mediaEngineScript);
