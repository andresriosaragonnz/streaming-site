import { Segment, PlaylistsMap } from "../types.js";
import { parseSegmentsData } from "../utils/segmentUtils.js";
import { createShareUrl, appendToPlaylist } from "../utils/playlistUtils.js";

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
          source: "", // Ensures active.source exists safely as an empty string
          status: "public",
          cardImage: "",
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
    nextSegment() {
      console.log("in next segment");
      if (this.segments.length === 0) return;

      if (this.currentIndex < this.segments.length - 1) {
        this.currentIndex++;
      }
      // Option B (Loop playlist): Uncomment line below to wrap back to first track
      else {
        this.currentIndex = 0;
      }
    },
  });

  // 3. REGISTER PLAYLISTS STORE
  Alpine.store("playlists", {
    playlists: { favorites: [], shared: [] } as PlaylistsMap,
    async generateShareLink(playlistName: string): Promise<void> {
      const ids = this.playlists[playlistName];
      console.log({ playlistName, ids });

      // Use the explicit Alpine reference passed into initAlpineStores
      Alpine.store("toast").trigger("Cannot share an empty playlist.", "info");

      if (!ids || ids.length === 0) {
        return;
      }

      const shareUrl = createShareUrl(window.location.origin, ids);

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

  Alpine.store("toast", {
    show: false,
    message: "",
    type: "success" as "success" | "error" | "info",
    timeoutId: null as any,

    trigger(
      message: string,
      type: "success" | "error" | "info" = "success",
      duration = 3000,
    ) {
      // Clear any existing timeout if a new toast arrives quickly
      if (this.timeoutId) {
        clearTimeout(this.timeoutId);
      }

      this.message = message;
      this.type = type;
      this.show = true;

      this.timeoutId = setTimeout(() => {
        this.show = false;
      }, duration);
    },

    dismiss() {
      this.show = false;
    },
  });
}
