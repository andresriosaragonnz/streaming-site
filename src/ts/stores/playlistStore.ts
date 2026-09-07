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
  isShareModalOpen: boolean;
  shareUrl: string;
}

const STORAGE_KEY = "user_playlists";

export class PlaylistStore {
  public state: PlaylistState = {
    playlistName: "Favorites",
    tracks: [],
    currentIndex: 0,
    isShareModalOpen: false,
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
        console.log({ userPlaylists });
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

  get currentTrack(): PlaylistTrack | undefined {
    return this.state.tracks[this.state.currentIndex];
  }

  get totalTracks(): number {
    return this.state.tracks.length;
  }

  get shareUrl(): string {
    return this.state.shareUrl;
  }

  get isShareModalOpen(): boolean {
    return this.state.isShareModalOpen;
  }

  get hasTracks(): boolean {
    return this.state.tracks.length > 0;
  }

  get activeTrackId(): string | undefined {
    return this.currentTrack?.id;
  }

  // ---------------------------------------------------------------------------
  // Store Actions & Mutations
  // ---------------------------------------------------------------------------

  public selectTrack(index: number): void {
    if (index < 0 || index >= this.state.tracks.length) return;
    this.state.currentIndex = index;
    this.notify();
  }

  public selectTrackById(id: string): void {
    const index = this.state.tracks.findIndex((t) => t.id === id);
    if (index !== -1) {
      this.selectTrack(index);
    }
  }

  public addTrack(track: PlaylistTrack): void {
    const exists = this.state.tracks.some((t) => t.id === track.id);
    if (!exists) {
      this.state.tracks.push(track);
      this.syncUserPlaylistsToStorage();
      this.generateShareUrl();
      this.notify();
    }
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

  public setPlaylistName(name: string): void {
    this.state.playlistName = name;
    this.generateShareUrl();
    this.notify();
  }

  public reorderTracks(fromIndex: number, toIndex: number): void {
    if (
      fromIndex < 0 ||
      fromIndex >= this.state.tracks.length ||
      toIndex < 0 ||
      toIndex >= this.state.tracks.length
    ) {
      return;
    }

    const [movedTrack] = this.state.tracks.splice(fromIndex, 1);
    this.state.tracks.splice(toIndex, 0, movedTrack);

    if (this.state.currentIndex === fromIndex) {
      this.state.currentIndex = toIndex;
    } else if (
      this.state.currentIndex > fromIndex &&
      this.state.currentIndex <= toIndex
    ) {
      this.state.currentIndex--;
    } else if (
      this.state.currentIndex < fromIndex &&
      this.state.currentIndex >= toIndex
    ) {
      this.state.currentIndex++;
    }

    this.syncUserPlaylistsToStorage();
    this.generateShareUrl();
    this.notify();
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

  public toggleShareModal(isOpen?: boolean): void {
    this.state.isShareModalOpen = isOpen ?? !this.state.isShareModalOpen;
    this.notify();
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
