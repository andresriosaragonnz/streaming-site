// =============================================================================
// Player Store Architecture (ID-Based State Management)
// =============================================================================

import {
  getSegmentVideoSource,
  getTargetQuality,
  VideoQuality,
} from "../utils/mediaController.js";

export interface MediaSegment {
  id: string;
  title: string;
  formattedArtist: string;
  artistName: string;
  sourceMp3: string;
  sourceVideo1080p?: string;
  sourceVideo480p?: string;
  sourceVideo?: string; // Fallback
  cardImage?: string;
  duration?: number;
}

export interface PlayerState {
  activeId: string | null;
  isPlaying: boolean;
  isAudioMode: boolean; // false = video mode, true = audio mode
  segments: MediaSegment[];
  currentTime: number;
  duration: number;
}

export class PlayerStore {
  public state: PlayerState = {
    activeId: null,
    isPlaying: false,
    isAudioMode: false,
    segments: [],
    currentTime: 0,
    duration: 0,
  };

  constructor(initialSegments: MediaSegment[] = []) {
    this.state.segments = [...initialSegments];
    if (this.state.segments.length > 0) {
      this.state.activeId = this.state.segments[0].id;
    }
  }

  private notify(): void {
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("player-track-changed"));
    }
  }

  // ---------------------------------------------------------------------------
  // Getters for Binder Expressions
  // ---------------------------------------------------------------------------

  get currentTrack(): MediaSegment | undefined {
    return this.state.segments.find((s) => s.id === this.state.activeId);
  }

  get currentTitle(): string | undefined {
    return this.currentTrack?.title;
  }

  get currentIndex(): number {
    return this.state.segments.findIndex((s) => s.id === this.state.activeId);
  }

  get activeSegmentId(): string | null {
    return this.state.activeId;
  }

  get isPlaying(): boolean {
    return this.state.isPlaying;
  }

  get isAudioMode(): boolean {
    return this.state.isAudioMode;
  }

  get totalSegments(): number {
    return this.state.segments.length;
  }

  get currentArtistName(): string {
    return this.currentTrack?.formattedArtist || "";
  }

  get currentArtistLink(): string {
    // Generates link slug from artist name or uses segment's explicit band link if present
    const track = this.currentTrack;
    if (!track) return "";

    // Example slug conversion: "Aidan Ripley" -> "aidan_ripley"
    return track.artistName;
  }

  public isSegmentActive(id: string): boolean {
    return this.state.activeId === id;
  }

  // ---------------------------------------------------------------------------
  // Actions & Mutations
  // ---------------------------------------------------------------------------

  public selectSegment(id: string): void {
    const exists = this.state.segments.some((s) => s.id === id);
    if (!exists) return;

    this.state.activeId = id;
    this.syncMediaElementSource();
    this.notify();
  }

  public toggleMode(): void {
    this.state.isAudioMode = !this.state.isAudioMode;

    const audioEl = document.getElementById(
      "r2-audio-player",
    ) as HTMLAudioElement | null;
    const videoEl = document.getElementById(
      "r2-video-player",
    ) as HTMLVideoElement | null;

    if (this.state.isAudioMode) {
      videoEl?.pause();
    } else {
      audioEl?.pause();
    }

    this.syncMediaElementSource();
    this.notify();
  }

  public setPlaying(isPlaying: boolean): void {
    if (this.state.isPlaying !== isPlaying) {
      this.state.isPlaying = isPlaying;
      this.notify();
    }
  }

  public updateTime(currentTime: number, duration: number): void {
    this.state.currentTime = currentTime;
    if (duration && !isNaN(duration)) {
      this.state.duration = duration;
    }
  }

  public syncMediaElementSource(): void {
    if (typeof window === "undefined") return;

    const track = this.currentTrack;
    if (!track) return;

    if (this.state.isAudioMode) {
      const audioEl = document.getElementById(
        "r2-audio-player",
      ) as HTMLAudioElement | null;
      if (audioEl && track.sourceMp3) {
        const isPlaying = !audioEl.paused;
        if (audioEl.src !== track.sourceMp3) {
          audioEl.src = track.sourceMp3;
          audioEl.load();
          if (isPlaying && this.state.isPlaying) {
            audioEl
              .play()
              .catch((err) =>
                console.error("[PlayerStore] Audio play error:", err),
              );
          }
        }
      }
    } else {
      const videoEl = document.getElementById(
        "r2-video-player",
      ) as HTMLVideoElement | null;
      if (videoEl) {
        const quality: VideoQuality = getTargetQuality();
        const videoSrc = getSegmentVideoSource(track, quality);

        if (track.cardImage) {
          videoEl.setAttribute("poster", `${track.cardImage}.jpg`);
          videoEl.poster = `${track.cardImage}.jpg`;
        }

        if (videoSrc && videoEl.src !== videoSrc) {
          const isPlaying = !videoEl.paused;
          videoEl.src = videoSrc;
          videoEl.load();

          if (isPlaying && this.state.isPlaying) {
            videoEl
              .play()
              .catch((err) =>
                console.error("[PlayerStore] Video play error:", err),
              );
          }
        }
      }
    }
  }
}

declare global {
  interface Window {
    playerStore?: PlayerStore;
  }
}

export function initPlayerStore(segments: MediaSegment[] = []): PlayerStore {
  const store = new PlayerStore(segments);
  if (typeof window !== "undefined") {
    window.playerStore = store;
  }
  return store;
}
