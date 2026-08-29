import { Segment } from "../types.js";

export function initPlayerStore(Alpine: any): void {
  // Inside initPlayerStore(Alpine: any):

  if (typeof window !== "undefined") {
    const initCarouselScroll = () => {
      const scrollList = document.getElementById("sidebar-scroll-list");
      const navLeft = document.getElementById("carousel-nav-left");
      const navRight = document.getElementById("carousel-nav-right");

      if (!scrollList || !navLeft || !navRight) return;

      const checkScroll = () => {
        navLeft.style.display = scrollList.scrollLeft > 0 ? "block" : "none";
        navRight.style.display =
          scrollList.scrollLeft <
          scrollList.scrollWidth - scrollList.clientWidth
            ? "block"
            : "none";
      };

      scrollList.addEventListener("scroll", checkScroll, { passive: true });
      navLeft.addEventListener("click", () =>
        scrollList.scrollBy({ left: -300, behavior: "smooth" }),
      );
      navRight.addEventListener("click", () =>
        scrollList.scrollBy({ left: 300, behavior: "smooth" }),
      );

      checkScroll();
    };

    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", initCarouselScroll);
    } else {
      initCarouselScroll();
    }
  }

  // 2. REGISTER REVIEW STORE
  Alpine.store("player", {
    segments: [] as Segment[],
    mode: true,
    currentIndex: 0,

    // 1. New helper to change track without auto-playing
    selectSegment(idx: number) {
      if (this.currentIndex === idx) return;
      this.currentIndex = idx;

      if (this.active?.cardImage) {
        const videoEl = document.getElementById(
          "r2-stream-player",
        ) as HTMLVideoElement | null;
        if (videoEl) {
          videoEl.poster = `${this.active.cardImage}.jpg`;
        }
      }
      // 2. Update Audio Source
      if (this.active?.sourceMp3) {
        const audioEl = document.getElementById(
          "r2-audio-player",
        ) as HTMLAudioElement | null;
        if (audioEl) {
          const nextSrc = this.active.sourceMp3;
          const currentSource = audioEl.getAttribute("src");

          if (currentSource !== nextSrc) {
            console.log({ audioEl, nextSrc, currentSource });
            audioEl.setAttribute("src", nextSrc);
            audioEl.load(); // Required so HTML5 audio re-buffers the new source
          }
        }
      }
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
