import { Segment, PlaylistsMap } from "../types";
import { getActiveSegment, parseSegmentsData } from "../utils/segmentUtils";
import { createShareUrl, appendToPlaylist } from "../utils/playlistUtils";

export function initAlpineStores(Alpine: any): void {
  // 1. REGISTER publicWorkspace DATA COMPONENT (Watcher & Hydration Hub)
  Alpine.data("publicWorkspace", () => ({
    init(this: any) {
      this.$nextTick(() => {
        const dataEl = document.getElementById("studio-segments-data");
        if (dataEl && dataEl.textContent) {
          this.$store.review.segments = parseSegmentsData(dataEl.textContent);
          this.$store.review.currentIndex = 0;
          console.log("✅ Public player workspace hydrated successfully.");

          if (typeof window.setupMediaPlayback === "function") {
            window.setupMediaPlayback(this.active, this.$store.review.mode);
          }
        }
      });

      // Watch currentIndex changes and trigger media playback
      this.$watch("$store.review.currentIndex", () => {
        this.$nextTick(() => {
          if (typeof window.setupMediaPlayback === "function") {
            window.setupMediaPlayback(this.active, this.$store.review.mode);
          }
        });
      });

      // Watch mode changes and trigger media playback switch
      this.$watch("$store.review.mode", () => {
        this.$nextTick(() => {
          if (typeof window.setupMediaPlayback === "function") {
            window.setupMediaPlayback(this.active, this.$store.review.mode);
          }
        });
      });
    },

    get active(): Segment {
      const store = Alpine.store("review");
      if (!store || !store.segments || !store.segments[store.currentIndex]) {
        return {
          id: "",
          title: "",
          cardImage: "/screenshots/card/card-fallback.jpg",
          status: "public",
        };
      }
      return store.segments[store.currentIndex];
    },
  }));

  // 2. REGISTER REVIEW STORE
  Alpine.store("review", {
    segments: [] as Segment[],
    mode: true,
    currentIndex: 0,

    togleMode() {
      this.mode = !this.mode;
    },
  });

  // 3. REGISTER PLAYLISTS STORE
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
      const activeSegment = reviewStore.segments[reviewStore.currentIndex];
      if (activeSegment && activeSegment.id) {
        this.addToPlaylist(activeSegment.id, playlistName);
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
