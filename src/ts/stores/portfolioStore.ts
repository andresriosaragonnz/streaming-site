// =============================================================================
// Portfolio Store Architecture
// =============================================================================

import {
  PLAYLIST_STORAGE_KEY,
  getPlaylistItems,
  createPortfolioUrl,
  createShareUrl,
} from "../utils/playlistUtils";

export interface PortfolioState {
  isLoading: boolean;
  count: number;
  shareUrls: Record<string, string>;
}

export class PortfolioStore {
  public state: PortfolioState = {
    isLoading: true,
    count: 0,
    shareUrls: {},
  };

  /**
   * Emits custom event to notify binder.ts of reactive state updates.
   */
  private notify(): void {
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("portfolio-state-changed"));
    }
  }

  // ---------------------------------------------------------------------------
  // Getters for Binder Expressions & Templates
  // ---------------------------------------------------------------------------

  get isLoading(): boolean {
    return this.state.isLoading;
  }

  get count(): number {
    return this.state.count;
  }

  public getShareUrl(playlistName: string): string {
    return this.state.shareUrls[playlistName].toLowerCase() || "#";
  }

  // ---------------------------------------------------------------------------
  // Store Actions & Component Fetching
  // ---------------------------------------------------------------------------

  /**
   * Scans localStorage playlists, generates share URLs for each card,
   * and fetches pre-rendered HTML components.
   */
  public async loadPortfolioComponents(): Promise<void> {
    this.state.isLoading = true;
    this.notify();

    try {
      // 1. Scan localStorage and build per-playlist share URLs
      this.generateAllShareUrls();

      // 2. Parse localStorage playlists into normalized lists for server fragment fetching
      const { l, ids, listNames } = getPlaylistItems();

      // 3. Build target endpoint URL using base64 URL-safe parameters
      const origin =
        typeof window !== "undefined" ? window.location.origin : "";
      const targetUrl = createPortfolioUrl(
        `${origin}/api/playlists/portfolio-components`,
        listNames,
        ids,
        l,
      );

      // 4. Fetch pre-rendered HTML components
      const response = await fetch(targetUrl, {
        method: "GET",
        headers: {
          Accept: "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(
          `Failed to load portfolio fragments (${response.status})`,
        );
      }

      const data = (await response.json()) as {
        cardsHTML: string;
        heroHTML: string;
        count: number;
      };

      // 5. Swap HTML fragments directly into target container shells
      const gridEl = document.getElementById("performance-grid");
      const heroEl = document.getElementById("portfolio-hero-container");

      if (gridEl) gridEl.innerHTML = data.cardsHTML || "";
      if (heroEl) heroEl.innerHTML = data.heroHTML || "";

      // 6. Hydrate card anchor hrefs with calculated share URLs
      this.applyShareUrlsToCards();

      // 7. Update track count in reactive state
      this.state.count = data.count || 0;
    } catch (err) {
      console.error("[PortfolioStore] Error loading components:", err);

      const gridEl = document.getElementById("performance-grid");
      if (gridEl) {
        gridEl.innerHTML = `
          <div class="portfolio-empty-state">
            <p>Unable to load playlist portfolio at this time.</p>
          </div>
        `;
      }
    } finally {
      this.state.isLoading = false;
      this.notify();
    }
  }

  /**
   * Scans user_playlists in localStorage and constructs share URLs for each key.
   */
  public generateAllShareUrls(): Record<string, string> {
    if (typeof window === "undefined") return {};

    const saved = localStorage.getItem(PLAYLIST_STORAGE_KEY);
    console.log({ saved });
    const playlistsMap: Record<string, string[]> = saved
      ? JSON.parse(saved)
      : {};
    const origin = window.location.origin;
    const generatedUrls: Record<string, string> = {};

    for (const [name, segmentIds] of Object.entries(playlistsMap)) {
      if (Array.isArray(segmentIds) && segmentIds.length > 0) {
        generatedUrls[name] = createShareUrl(origin, segmentIds, name);
      } else {
        generatedUrls[name] = "#";
      }
    }

    this.state.shareUrls = generatedUrls;
    return generatedUrls;
  }

  /**
   * Directly updates href attributes on rendered cards based on data-playlist-name.
   */
  private applyShareUrlsToCards(): void {
    const cards = document.querySelectorAll<HTMLElement>(
      "[data-playlist-name]",
    );
    cards.forEach((card) => {
      const name = card.dataset.playlistName;
      if (!name) return;

      const targetUrl = this.getShareUrl(name);
      const links =
        card.querySelectorAll<HTMLAnchorElement>("a[data-card-link]");
      links.forEach((link) => {
        link.setAttribute("href", targetUrl);
      });
    });
  }
}

// ---------------------------------------------------------------------------
// Global Singleton Initialization & Declaration
// ---------------------------------------------------------------------------

declare global {
  interface Window {
    portfolioStore?: PortfolioStore;
  }
}

export function initPortfolioStore(): PortfolioStore {
  const store = new PortfolioStore();
  if (typeof window !== "undefined") {
    window.portfolioStore = store;
  }
  return store;
}
