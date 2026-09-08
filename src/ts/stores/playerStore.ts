// =============================================================================
// Player Store Architecture (ID-Based State Management)
// =============================================================================

import {
  getSegmentVideoSource,
  getTargetQuality,
  VideoQuality,
} from "../utils/mediaController.js";
import { getPlaylistItems } from "../utils/playlistUtils";

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
  availablePlaylists: string[];
}

/**
 * Reactive state store managing active audio/video segments, playback state,
 * and playlist integration.
 */
export class PlayerStore {
  public state: PlayerState = {
    activeId: null,
    isPlaying: false,
    isAudioMode: false,
    segments: [],
    currentTime: 0,
    duration: 0,
    availablePlaylists: [],
  };

  /**
   * Initializes store with media segments and populates default playlists.
   * @param initialSegments Array of MediaSegment objects to load into state.
   */
  constructor(initialSegments: MediaSegment[] = []) {
    this.state.segments = [...initialSegments];
    if (this.state.segments.length > 0) {
      this.state.activeId = this.state.segments[0].id;
    }
    const { listNames } = getPlaylistItems();
    this.state.availablePlaylists = listNames || ["Favorites"];
  }

  /**
   * Dispatches a global event for UI binders when reactive track state changes.
   */
  private notify(): void {
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("player-track-changed"));
    }
  }

  // ---------------------------------------------------------------------------
  // Getters for Binder Expressions
  // ---------------------------------------------------------------------------

  /** Returns the active MediaSegment object or undefined if unselected. */
  get currentTrack(): MediaSegment | undefined {
    return this.state.segments.find((s) => s.id === this.state.activeId);
  }

  /** Returns active track title. */
  get currentTitle(): string | undefined {
    return this.currentTrack?.title;
  }

  /**
   * Safe getter for card background images. Resolves `.jpg` extension safely
   * without creating invalid 'undefined.jpg' strings.
   */
  get currentCardImage(): string {
    const track = this.currentTrack;
    if (!track?.cardImage) return "";
    return track.cardImage.endsWith(".jpg")
      ? track.cardImage
      : `${track.cardImage}.jpg`;
  }

  /** Returns list of available playlist names for dropdown populators. */
  get availablePlaylists(): string[] {
    return this.state.availablePlaylists.length > 0
      ? this.state.availablePlaylists
      : ["Favorites"];
  }

  /** Returns 0-based array index of currently active segment. */
  get currentIndex(): number {
    return this.state.segments.findIndex((s) => s.id === this.state.activeId);
  }

  /** Returns active segment ID or null. */
  get activeSegmentId(): string | null {
    return this.state.activeId;
  }

  /** Returns current playback state. */
  get isPlaying(): boolean {
    return this.state.isPlaying;
  }

  /** Returns active mode flag (true = Audio, false = Video). */
  get isAudioMode(): boolean {
    return this.state.isAudioMode;
  }

  /** Returns total segment count in store. */
  get totalSegments(): number {
    return this.state.segments.length;
  }

  /** Returns formatted artist name for current track. */
  get currentArtistName(): string {
    return this.currentTrack?.formattedArtist || "";
  }

  /** Returns artist identifier or slug. */
  get currentArtistLink(): string {
    return this.currentTrack?.artistName || "";
  }

  /** Checks if a specific segment ID matches active state. */
  public isSegmentActive(id: string): boolean {
    return this.state.activeId === id;
  }

  // ---------------------------------------------------------------------------
  // Actions & Mutations
  // ---------------------------------------------------------------------------

  /**
   * Sets active segment ID and updates media element sources.
   * @param id Target segment ID.
   */
  public selectSegment(id: string): void {
    const exists = this.state.segments.some((s) => s.id === id);
    if (!exists) return;

    this.state.activeId = id;
    this.syncMediaElementSource();
    this.notify();
  }

  /**
   * Populates client-side `#playlist-select` element options directly.
   */
  public populatePlaylistDropdown(): void {
    if (typeof document === "undefined") return;
    const selectEl = document.getElementById(
      "playlist-select",
    ) as HTMLSelectElement | null;
    if (!selectEl) return;

    selectEl.innerHTML = "";

    this.availablePlaylists.forEach((name, index) => {
      const opt = document.createElement("option");
      opt.value = name;
      opt.textContent = name;
      if (index === 0) opt.selected = true;
      selectEl.appendChild(opt);
    });
  }

  /**
   * Toggles between Audio and Video playback modes, pausing inactive elements.
   */
  public toggleMode(): void {
    this.state.isAudioMode = !this.state.isAudioMode;

    if (typeof document !== "undefined") {
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
    }

    this.syncMediaElementSource();
    this.notify();
  }

  /** Updates play/pause boolean state and triggers custom dispatch. */
  public setPlaying(isPlaying: boolean): void {
    if (this.state.isPlaying !== isPlaying) {
      this.state.isPlaying = isPlaying;
      this.notify();
    }
  }

  /** Updates player timing state. */
  public updateTime(currentTime: number, duration: number): void {
    this.state.currentTime = currentTime;
    if (duration && !isNaN(duration)) {
      this.state.duration = duration;
    }
  }

  /**
   * Synchronizes active track source directly to DOM `<audio>` or `<video>` elements.
   */
  public syncMediaElementSource(): void {
    if (typeof window === "undefined" || typeof document === "undefined")
      return;

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
          const posterUrl = this.currentCardImage;
          videoEl.setAttribute("poster", `${posterUrl}`);
          videoEl.poster = `${posterUrl}`;
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

/**
 * Initializes global PlayerStore singleton on window instance.
 */
export function initPlayerStore(segments: MediaSegment[] = []): PlayerStore {
  const store = new PlayerStore(segments);
  if (typeof window !== "undefined") {
    window.playerStore = store;
  }
  return store;
}
