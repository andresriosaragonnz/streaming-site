import { PlaylistsMap } from "../types.js";
import {
  createShareUrl,
  appendToPlaylist,
  generatePortfolioLink,
  PLAYLIST_STORAGE_KEY,
} from "../utils/playlistUtils.js";

export function initPlaylistStore(Alpine: any): void {
  Alpine.store("playlists", {
    // 1. Initial State (tries loading from LocalStorage first, defaults to empty arrays)
    playlists: (() => {
      try {
        const saved = localStorage.getItem(PLAYLIST_STORAGE_KEY);
        const finalList = saved ? JSON.parse(saved) : { favorites: [] };
        return finalList;
      } catch {
        return { favorites: [], shared: [] };
      }
    })() as PlaylistsMap,

    // 2. Alpine automatically calls init() when registering the store
    init() {
      console.log("here");
      generatePortfolioLink();
    },

    getPlaylistOptions() {
      const current = this.playlists;
      return [...Object.keys(current), "+ New Playlist..."];
    },

    getPlaylistsPortfolio() {
      const values = Object.keys(this.playlists).reduce((acc, current) => {
        const playlist = this.playlists[current];
        if (playlist.length === 0) {
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
    // Helper method to sync current state to LocalStorage
    saveToLocalStorage(): void {
      try {
        localStorage.setItem(
          PLAYLIST_STORAGE_KEY,
          JSON.stringify(this.playlists),
        );
      } catch (err) {
        console.error("Failed to save playlists to localStorage:", err);
      }
    },

    getShareUrl(playlistName: string): string {
      const ids = this.playlists[playlistName];
      if (!ids || ids.length === 0) return "#";

      return createShareUrl(window.location.origin, ids, playlistName);
    },

    async generateShareLink(playlistName: string): Promise<void> {
      const shareUrl = this.getShareUrl(playlistName);

      if (shareUrl === "#") {
        Alpine.store("toast").trigger(
          "Cannot share an empty playlist.",
          "info",
        );
        return;
      }

      try {
        await navigator.clipboard.writeText(shareUrl);
        Alpine.store("toast").trigger(
          "📋 Playlist link copied to clipboard!",
          "success",
        );
      } catch (err) {
        console.error("Failed to copy to clipboard:", err);
        Alpine.store("toast").trigger(
          "❌ Failed to copy link to clipboard.",
          "error",
        );
      }
    },
    getShareLink(playlistName: string): string {
      const ids = this.playlists[playlistName];
      const shareUrl = createShareUrl(
        window.location.origin,
        ids,
        playlistName,
      );
      return shareUrl;
    },

    addActiveToPlaylist(playlistName: string): void {
      const playerStore = Alpine.store("player");
      const activeSegment = playerStore.segments[playerStore.currentIndex];
      if (activeSegment && activeSegment.id) {
        this.addToPlaylist(activeSegment.id, playlistName);
        generatePortfolioLink();
      }
    },

    addToPlaylist(segmentId: string, playlistName: string): void {
      this.playlists = appendToPlaylist(
        this.playlists,
        playlistName,
        segmentId,
      );

      // 2. Persist updated playlists to LocalStorage
      this.saveToLocalStorage();

      console.log(
        `📡 Playlist ${playlistName} updated locally and saved to localStorage.`,
      );

      // Optional feedback trigger
      Alpine.store("toast").trigger(`Added to ${playlistName}!`, "success");
    },
  });
}
