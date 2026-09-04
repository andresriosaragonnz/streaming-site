import { UI } from "./binder.js";
import "./actions.js"; // Registers data-action handlers
import { initGraphStore, GraphStore } from "./stores/graphStore.js";

declare global {
  interface Window {
    graphStore?: GraphStore;
  }
}

const initArtistPortfolioApp = () => {
  // Instantiate only the graph drawer store
  initGraphStore();

  // Initial pass for UI binder
  UI.requestSync();
};

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initArtistPortfolioApp);
} else {
  initArtistPortfolioApp();
}
