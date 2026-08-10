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
          this.$store.player.segments = parseSegmentsData(dataEl.textContent);
          this.$store.player.currentIndex = 0;
          console.log("✅ Public player workspace hydrated successfully.");

          if (typeof window.setupMediaPlayback === "function") {
            window.setupMediaPlayback(
              this.active,
              this.$store.player.mode,
              true,
            );
          }
        }
      });
    },

    get active(): Segment {
      const store = Alpine.store("player");
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
}
