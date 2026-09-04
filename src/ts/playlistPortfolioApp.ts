import { UI } from "./binder.js";
import "./actions.js"; // Registers global data-action handlers
import { initToastStore, ToastStore } from "./stores/toastStore.js";
import { initPortfolioStore, PortfolioStore } from "./stores/portfolioStore.js";

declare global {
  interface Window {
    toastStore?: ToastStore;
    portfolioStore?: PortfolioStore;
  }
}

/**
 * Client entry point for the Playlist Portfolio grid.
 */
function initPortfolioApp(): void {
  // 1. Instantiate reactive stores for portfolio and toasts
  initToastStore();
  const portfolioStore = initPortfolioStore();

  // 2. Load localStorage playlists, generate card share URLs, & swap HTML fragments
  portfolioStore.loadPortfolioComponents();

  // 3. Perform initial UI binder sync pass
  UI.requestSync();

  console.log("🚀 [Portfolio App] Initialized portfolioStore & toastStore.");
}

// Bootstrap on DOM ready
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initPortfolioApp);
} else {
  initPortfolioApp();
}
