// =============================================================================
// Playlist Store Architecture
// =============================================================================
import { createShareUrl } from "../utils/playlistUtils";

export interface PlaylistTrack {
  id: string;
  title: string;
  artist: string;
  sourceMp3: string;
  cardImage?: string;
  isPublic: boolean;
  duration?: number;
}

export interface PlaylistState {
  playlistName: string;
  tracks: PlaylistTrack[];
  currentIndex: number;
  shareUrl: string;
}

const STORAGE_KEY = "user_playlists";

export class PlaylistStore {
  public state: PlaylistState = {
    playlistName: "Favorites",
    tracks: [],
    currentIndex: 0,
    shareUrl: "",
  };

  constructor(initialTracks: PlaylistTrack[] = [], playlistName = "Favorites") {
    this.state.playlistName = playlistName;
    this.state.tracks = [...initialTracks];
    this.generateShareUrl();
  }

  /**
   * Syncs the current state.tracks array back to localStorage under playlistName.
   */
  private syncUserPlaylistsToStorage(): void {
    if (typeof window === "undefined" || !this.state.playlistName) return;

    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      let userPlaylists: Record<string, string[]> = {};

      if (raw) {
        userPlaylists = JSON.parse(raw);
      }
      if (this.state.tracks.length > 0) {
        userPlaylists[this.state.playlistName] = this.state.tracks.map(
          (t) => t.id,
        );
        localStorage.setItem(STORAGE_KEY, JSON.stringify(userPlaylists));
      } else {
        delete userPlaylists[this.state.playlistName];
        localStorage.setItem(STORAGE_KEY, JSON.stringify(userPlaylists));
        if (Object.keys(userPlaylists).length === 0) {
          localStorage.removeItem(STORAGE_KEY);
        }
        if (typeof window !== "undefined") {
          // Redirect to "My Playlist" (or "Favorites" default view)
          window.location.href = "myplaylists";
        }
      }
    } catch (err) {
      console.error("Failed to sync playlist changes to localStorage:", err);
    }
  }

  /**
   * Emits custom event to notify binder.ts of reactive state updates.
   */
  private notify(): void {
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("playlist-state-changed"));
    }
  }

  // ---------------------------------------------------------------------------
  // Getters for Binder Expressions
  // ---------------------------------------------------------------------------

  get shareUrl(): string {
    return this.state.shareUrl;
  }

  // ---------------------------------------------------------------------------
  // Store Actions & Mutations
  // ---------------------------------------------------------------------------

  /**
   * Persists a reordered list of segment IDs as the active playlist order.
   */
  public setTrackOrder(ids: string[]): void {
    const byId = new Map(this.state.tracks.map((track) => [track.id, track]));
    const reordered = ids
      .map((id) => byId.get(id))
      .filter((track): track is PlaylistTrack => Boolean(track));

    if (reordered.length !== this.state.tracks.length) return;

    this.state.tracks = reordered;
    this.syncUserPlaylistsToStorage();
    this.generateShareUrl();
    this.notify();
  }

  /**
   * Saves active segment ID into local user_playlists storage under specified playlist key.
   */
  public addCurrentSegmentToPlaylist(targetPlaylistName: string): void {
    if (!targetPlaylistName) return;

    const activeId = window.playerStore?.activeSegmentId;
    if (!activeId) return;

    let userPlaylists: Record<string, string[]> = {};

    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) userPlaylists = JSON.parse(raw);
    } catch (err) {
      console.error("Failed to parse local user_playlists:", err);
    }

    if (!Array.isArray(userPlaylists[targetPlaylistName])) {
      userPlaylists[targetPlaylistName] = [];
    }

    if (userPlaylists[targetPlaylistName].includes(activeId)) {
      window.toastStore?.trigger(`Already in "${targetPlaylistName}"`, "info");
      return;
    }

    userPlaylists[targetPlaylistName].push(activeId);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(userPlaylists));

    window.toastStore?.trigger(`Saved to "${targetPlaylistName}"`, "success");

    this.notify();
  }

  public removeTrack(index: number): void {
    if (index < 0 || index >= this.state.tracks.length) return;
    this.state.tracks.splice(index, 1);

    if (this.state.currentIndex >= this.state.tracks.length) {
      this.state.currentIndex = Math.max(0, this.state.tracks.length - 1);
    }
    this.syncUserPlaylistsToStorage();
    this.generateShareUrl();
    this.notify();
  }

  public removeTrackById(id: string): void {
    const index = this.state.tracks.findIndex((t) => t.id === id);
    if (index !== -1) {
      this.removeTrack(index);
    }
  }

  public generateShareUrl(): string {
    if (typeof window === "undefined") return "";

    const origin = window.location.origin;
    const segmentIds = this.state.tracks.map((track) => track.id);

    this.state.shareUrl = createShareUrl(
      origin,
      segmentIds,
      this.state.playlistName,
    );
    return this.state.shareUrl;
  }
}

// Global Singleton Interface
declare global {
  interface Window {
    playlistStore?: PlaylistStore;
  }
}

export function initPlaylistStore(
  tracks: PlaylistTrack[] = [],
  name?: string,
): PlaylistStore {
  const store = new PlaylistStore(tracks, name);
  if (typeof window !== "undefined") {
    window.playlistStore = store;
  }
  return store;
}
