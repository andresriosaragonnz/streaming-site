// public/js/stores/playlistStore.ts
import { PlaylistsMap } from "../types.js";
import {
  generatePortfolioLink,
  generateFollowLink,
  PLAYLIST_STORAGE_KEY,
  handleMyPlaylistsRedirect,
  createShareUrl,
} from "../utils/playlistUtils.js";

export function createPlaylistStore() {
  // 1. Initial State (tries loading from LocalStorage first, defaults to empty arrays)
  const loadInitialState = (): PlaylistsMap => {
    try {
      handleMyPlaylistsRedirect();
      const saved = localStorage.getItem(PLAYLIST_STORAGE_KEY);
      return saved ? JSON.parse(saved) : { favorites: [] };
    } catch {
      return { favorites: [], shared: [] };
    }
  };

  const rawState = {
    playlists: loadInitialState() as PlaylistsMap,
  };

  // 2. Reactive Proxy interceptor
  const state = new Proxy(rawState, {
    set(target, prop, value) {
      (target as any)[prop] = value;
      console.log("here", PLAYLIST_STORAGE_KEY, JSON.stringify(value));
      // Auto-persist whenever the playlists map mutates
      if (prop === "playlists") {
        try {
          localStorage.setItem(PLAYLIST_STORAGE_KEY, JSON.stringify(value));
        } catch (err) {
          console.error("Failed to save playlists to localStorage:", err);
        }
      }

      // Automatically notify binder listeners
      window.dispatchEvent(
        new CustomEvent("playlists-changed", { detail: store }),
      );
      return true;
    },
  });

  // 3. Store methods and getters
  const store = {
    state,

    init() {
      generatePortfolioLink();
      generateFollowLink();
    },

    get playlistOptions(): string[] {
      const current = state.playlists;
      return [...Object.keys(current), "+ New Playlist..."];
    },

    get playlistsPortfolio(): Record<
      string,
      { amount: number; image: string }
    > {
      const values = Object.keys(state.playlists).reduce((acc, current) => {
        const playlist = state.playlists[current];
        if (!playlist || playlist.length === 0) {
          return acc;
        }
        return {
          ...acc,
          [current]: {
            amount: playlist.length,
            image: `https://pub-fef6bcaae286450e98785a845f724ff1.r2.dev/images/${playlist[0]}_card`,
          },
        };
      }, {});
      return values;
    },

    saveToLocalStorage(): void {
      try {
        localStorage.setItem(
          PLAYLIST_STORAGE_KEY,
          JSON.stringify(state.playlists),
        );
      } catch (err) {
        console.error("Failed to save playlists to localStorage:", err);
      }
    },

    getShareUrl(playlistName: string): string {
      const ids = state.playlists[playlistName];
      if (!ids || ids.length === 0) return "#";

      return createShareUrl(window.location.origin, ids, playlistName);
    },

    async generateShareLink(playlistName: string): Promise<void> {
      const shareUrl = this.getShareUrl(playlistName);

      if (shareUrl === "#") {
        this.showNotification("Cannot share an empty playlist.", "info");
        return;
      }

      try {
        await navigator.clipboard.writeText(shareUrl);
        this.showNotification(
          "📋 Playlist link copied to clipboard!",
          "success",
        );
      } catch (err) {
        console.error("Failed to copy to clipboard:", err);
        this.showNotification("❌ Failed to copy link to clipboard.", "error");
      }
    },

    addActiveToPlaylist(playlistName: string): void {
      const player = window.playerStore;
      const activeSegment = player?.active;
      if (activeSegment && activeSegment.id) {
        this.addToPlaylist(activeSegment.id, playlistName);
        generatePortfolioLink();
      }
    },
    // public/js/stores/playlistStore.ts
    // public/js/stores/playlistStore.ts

    // public/js/stores/playlistStore.ts

    async shareCurrentPlaylist(playlistName?: string): Promise<void> {
      const targetName =
        playlistName ||
        new URLSearchParams(window.location.search).get("name") ||
        "favorites";

      const shareUrl = this.getShareUrl(targetName);

      if (!shareUrl || shareUrl === "#") {
        this.showNotification(
          `Cannot share empty playlist "${targetName}".`,
          "info",
        );
        return;
      }

      // 1. Always persist to localStorage
      try {
        localStorage.setItem("last_copied_share_url", shareUrl);
      } catch (err) {
        console.error("Failed to save share URL to localStorage:", err);
      }

      // 2. Try Web Share API (Android Chrome native sheet)
      if (navigator.share) {
        try {
          await navigator.share({
            title: `Playlist: ${targetName}`,
            url: shareUrl,
          });
          return;
        } catch (err: any) {
          if (err.name === "AbortError") return; // User closed share sheet
        }
      }

      // 3. Fallback: Modern Clipboard API
      if (navigator.clipboard && window.isSecureContext) {
        try {
          await navigator.clipboard.writeText(shareUrl);
          this.showNotification("Copied to clipboard!", "success");
          return;
        } catch (err) {
          console.warn("Clipboard write failed, using textarea fallback", err);
        }
      }

      // 4. Fallback for HTTP / non-secure contexts on Android
      try {
        const textArea = document.createElement("textarea");
        textArea.value = shareUrl;
        textArea.style.position = "fixed";
        textArea.style.left = "-9999px";
        textArea.style.top = "0";
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();

        const successful = document.execCommand("copy");
        document.body.removeChild(textArea);

        if (successful) {
          this.showNotification("Copied to clipboard!", "success");
        } else {
          throw new Error("execCommand copy returned false");
        }
      } catch (err) {
        console.error("All copy mechanisms failed:", err);
        this.showNotification("Failed to copy link", "error");
      }
    },
    addToPlaylist(segmentId: string, playlistName: string): void {
      // 1. Get current playlist array or default to empty
      const currentList = state.playlists[playlistName] || [];

      // Prevent duplicate track IDs in the same playlist
      if (currentList.includes(segmentId)) {
        this.showNotification(`Already in ${playlistName}!`, "info");
        return;
      }
      // 2. CRITICAL: Re-assign state.playlists with a NEW object reference
      // This triggers the Proxy set() trap, saves to localStorage, and fires 'playlists-changed'
      state.playlists = {
        ...state.playlists,
        [playlistName]: [...currentList, segmentId],
      };

      this.showNotification(`Added to ${playlistName}!`, "success");
    },

    // Add inside playlistStore.ts store object

    async deleteItemFromActivePlaylist(
      index: string,
      playlistName?: string,
    ): Promise<void> {
      console.log({ index });
      // 1. Determine target playlist name from argument, URL search params, or default to "favorites"
      const targetName =
        playlistName ||
        new URLSearchParams(window.location.search).get("name") ||
        "favorites";

      const currentList = state.playlists[targetName];
      // const itemIndex = parseInt(index, 10);

      // if (
      //   !currentList ||
      //   isNaN(itemIndex) ||
      //   itemIndex < 0 ||
      //   itemIndex >= currentList.length
      // ) {
      //   console.warn(
      //     `[playlistStore] Invalid deletion target. Index: ${index}, Playlist: "${targetName}"`,
      //   );
      //   return;
      // }

      // 2. Resolve the track ID and fetch the segment title from playerStore
      const trackId = index;
      const player = (window as any).playerStore;
      const segment = player?.findSegmentById?.(trackId);
      const trackTitle = segment?.title ? `"${segment.title}"` : "this item";

      // 3. Prompt native confirm dialog with the segment title
      const confirmed = window.confirm(
        `Are you sure you want to remove ${trackTitle} from "${targetName}"?`,
      );
      if (!confirmed) return;

      // 4. Filter out item at specified index
      const updatedList = currentList.filter((item) => item !== index);

      // 5. Re-assign state.playlists reference to trigger Proxy set() trap
      state.playlists = {
        ...state.playlists,
        [targetName]: updatedList,
      };

      generatePortfolioLink();
      const url = createShareUrl(
        window.location.origin,
        updatedList,
        targetName,
      );
      const cardId = `playlist-segment-card-${index}`;

      document.getElementById(cardId)?.remove();
      window.location.replace(url);
    },

    showNotification(
      message: string,
      type: "success" | "info" | "error",
    ): void {
      window.dispatchEvent(
        new CustomEvent("app-toast-trigger", {
          detail: { message, type },
        }),
      );
    },
  };

  // Run initialization routines
  store.init();

  return store;
}

export type PlaylistStore = ReturnType<typeof createPlaylistStore>;
