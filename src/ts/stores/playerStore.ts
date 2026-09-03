import { Segment } from "../types.js";

const PLAYLIST_STORAGE_KEY = "user_playlists";

export function createPlayerStore(initialSegments: Segment[] = []) {
  const rawState = {
    segments: initialSegments,
    currentIndex: 0,
    mode: true, // true = video, false = audio
  };

  const state = new Proxy(rawState, {
    set(target, prop, value) {
      (target as any)[prop] = value;

      // Auto-persist whenever the segments array changes
      if (prop === "segments") {
        try {
          localStorage.setItem(PLAYLIST_STORAGE_KEY, JSON.stringify(value));
        } catch (err) {
          console.error("Failed to save playlist to localStorage:", err);
        }
      }

      window.dispatchEvent(
        new CustomEvent("player-track-changed", { detail: store }),
      );
      return true;
    },
  });

  // Store methods and getters
  const store = {
    state,

    get active(): Segment {
      return (
        state.segments[state.currentIndex] || {
          id: "",
          title: "",
          status: "private",
        }
      );
    },

    get currentTitle(): string {
      return this.active.formattedTitle || this.active.title || "";
    },

    get currentArtistName(): string {
      return this.active.formattedArtist || this.active.artistName || "";
    },

    get currentArtistLink(): string {
      return `${this.active.artistName || ""}`;
    },

    get currentPoster(): string {
      return this.active.cardImage ? `${this.active.cardImage}.jpg` : "";
    },

    get isAudioMode(): boolean {
      return !state.mode;
    },

    findSegmentById(segmentId: string): Segment | undefined {
      if (!segmentId) return undefined;
      return state.segments.find(
        (segment) =>
          segment.id === segmentId || (segment as any).slug === segmentId,
      );
    },

    isSegmentActive(idx: number): boolean {
      return state.currentIndex === idx;
    },

    /**
     * Explicitly starts playback when the user clicks the Play button.
     */
    playCurrent() {
      const activeSegment = this.active;
      if (!activeSegment?.id) return;

      if (typeof window.setupMediaPlayback === "function") {
        window.setupMediaPlayback(activeSegment, state.mode, true);
      }
    },

    /**
     * Selects a segment track and loads the poster image without auto-playing.
     */
    async selectSegment(idx: number) {
      if (idx < 0 || idx >= state.segments.length) return;

      const videoEl = document.getElementById(
        "r2-stream-player",
      ) as HTMLVideoElement | null;
      const audioEl = document.getElementById(
        "r2-audio-player",
      ) as HTMLAudioElement | null;

      // 1. Immediately pause and reset active media elements
      if (videoEl) {
        videoEl.pause();
        videoEl.currentTime = 0;
      }
      if (audioEl) {
        audioEl.pause();
        audioEl.currentTime = 0;
      }

      // 2. Update current index state
      state.currentIndex = idx;

      // 3. Ensure play overlay icon button is visible over the new poster
      const overlayEl = document.getElementById("video-play-overlay");
      if (overlayEl) {
        overlayEl.style.display = "grid";
      }

      // 4. Update poster frame for newly selected segment
      if (this.active.cardImage && videoEl) {
        videoEl.poster = `${this.active.cardImage}.jpg`;
      }

      // 5. Update audio source if present
      if (this.active.sourceMp3 && audioEl) {
        if (audioEl.getAttribute("src") !== this.active.sourceMp3) {
          audioEl.setAttribute("src", this.active.sourceMp3);
          audioEl.load();
        }
      }

      // 6. Prime setupMediaPlayback in STOPPED mode (shouldPlay = false)
      if (typeof window.setupMediaPlayback === "function") {
        try {
          await window.setupMediaPlayback(this.active, state.mode, false);
        } catch (err) {
          console.error("⚠️ [PlayerStore] Error switching media segment:", err);
        }
      }
    },

    /**
     * Toggles between Video and Audio modes without auto-playing.
     */
    toggleMode() {
      state.mode = !state.mode;
      if (typeof window.setupMediaPlayback === "function") {
        window.setupMediaPlayback(this.active, state.mode, false);
      }
    },

    nextSegment() {
      if (state.segments.length === 0) return;
      const nextIdx =
        state.currentIndex < state.segments.length - 1
          ? state.currentIndex + 1
          : 0;
      this.selectSegment(nextIdx);
    },

    prevSegment() {
      if (state.segments.length === 0) return;
      const prevIdx =
        state.currentIndex > 0
          ? state.currentIndex - 1
          : state.segments.length - 1;
      this.selectSegment(prevIdx);
    },
  };

  return store;
}

export type PlayerStore = ReturnType<typeof createPlayerStore>;
