import { Segment, PlaylistsMap } from "../types.js";
import { getActiveSegment, parseSegmentsData } from "../utils/segmentUtils.js";
import { createShareUrl, appendToPlaylist } from "../utils/playlistUtils.js";

export function initAlpineStores(Alpine: any): void {
  // CONSOLIDATED REVIEW STORE (Data + Workspace Lifecycle)
  Alpine.store("review", {
    segments: [] as Segment[],
    mode: true,
    currentIndex: 0,

    // Hydrate store directly from the DOM element
    init() {
      Alpine.effect(() => {
        // Run after Alpine mounts DOM nodes
        setTimeout(() => {
          const dataEl = document.getElementById("studio-segments-data");
          if (dataEl && dataEl.textContent && this.segments.length === 0) {
            this.segments = parseSegmentsData(dataEl.textContent);
            this.currentIndex = 0;
            console.log("✅ Review store hydrated successfully.");
            this.triggerPlaybackUpdate();
          }
        }, 0);
      });
    },

    // Reactive active segment getter
    get active(): Segment {
      return getActiveSegment(this.segments, this.currentIndex);
    },

    // Actions
    togleMode() {
      this.mode = !this.mode;
      this.triggerPlaybackUpdate();
    },

    setCurrentIndex(index: number) {
      if (index >= 0 && index < this.segments.length) {
        this.currentIndex = index;
        this.triggerPlaybackUpdate();
      }
    },

    triggerPlaybackUpdate() {
      if (typeof window.setupMediaPlayback === "function") {
        window.setupMediaPlayback(this.active, this.mode);
      }
    },
  });

  // PLAYLISTS STORE
  Alpine.store("playlists", {
    playlists: { favorites: [], shared: [] } as PlaylistsMap,

    async generateShareLink(playlistName: string): Promise<void> {
      const ids = this.playlists[playlistName];
      if (!ids || ids.length === 0) {
        alert("⚠️ Cannot share an empty playlist.");
        return;
      }

      const shareUrl = createShareUrl(window.location.origin, ids);

      try {
        await navigator.clipboard.writeText(shareUrl);
        alert("copied to clipboard");
      } catch (err) {
        console.error("Failed to copy to clipboard:", err);
      }
    },

    addActiveToPlaylist(playlistName: string): void {
      const reviewStore = Alpine.store("review");
      if (reviewStore.active && reviewStore.active.id) {
        this.addToPlaylist(reviewStore.active.id, playlistName);
      }
    },

    addToPlaylist(segmentId: string, playlistName: string): void {
      this.playlists = appendToPlaylist(
        this.playlists,
        playlistName,
        segmentId,
      );
      console.log(`📡 Playlist ${playlistName} updated locally.`);
    },
  });
}
