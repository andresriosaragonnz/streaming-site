import { Segment } from "../types.js";

export function initPlayerStore(Alpine: any): void {
  // 2. REGISTER REVIEW STORE
  Alpine.store("player", {
    segments: [] as Segment[],
    mode: true,
    currentIndex: 0,

    // 1. New helper to change track without auto-playing
    selectSegment(idx: number) {
      if (this.currentIndex === idx) return;
      this.currentIndex = idx;
      if (typeof window.setupMediaPlayback === "function") {
        window.setupMediaPlayback(this.active, this.mode, true);
      }
    },

    playCurrent() {
      // Pass FALSE to trigger active stream fetch & play
      if (typeof window.setupMediaPlayback === "function") {
        window.setupMediaPlayback(this.active, this.mode, false);
      }
    },

    get active(): Segment {
      const store = Alpine.store("player");
      if (!store || !store.segments || !store.segments[store.currentIndex]) {
        return {
          id: "",
          title: "",
          cardImage: "",
          status: "private",
        };
      }
      return store.segments[store.currentIndex];
    },

    togleMode() {
      this.mode = !this.mode;
      if (typeof window.setupMediaPlayback === "function") {
        window.setupMediaPlayback(this.active, this.mode, true);
      }
    },
    nextSegment() {
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
}
