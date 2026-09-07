// =============================================================================
// Review Store Architecture
// =============================================================================

export interface TrackSegment {
  id: string;
  title: string;
  status: "public" | "private";
  isPublic: boolean;
  [key: string]: any;
}

export interface ReviewState {
  tracks: TrackSegment[];
  isCommitModalOpen: boolean;
  isGraphDrawerOpen: boolean;
  isSubmitting: boolean;
}

export class ReviewStore {
  public state: ReviewState = {
    tracks: [],
    isCommitModalOpen: false,
    isGraphDrawerOpen: false,
    isSubmitting: false,
  };

  private initialStatuses: Record<string, string> = {};
  private initialTitles: Record<string, string> = {};

  constructor(initialSegments: any[] = []) {
    const initialReviewTracks: TrackSegment[] = initialSegments.map((s) => {
      const isPublic = s.status === "public" || Boolean(s.isPublic);
      return {
        ...s,
        title: s.title || "",
        isPublic,
        status: isPublic ? "public" : "private",
      };
    });

    this.state.tracks = initialReviewTracks;
    this.initialTitles = this.createTitleSnapshot(initialReviewTracks);
    this.initialStatuses = this.createStatusSnapshot(initialReviewTracks);
  }

  /**
   * Helper: Resolves the active track segment from playerStore.
   */
  private get activeTrack(): TrackSegment | undefined {
    if (typeof window === "undefined") return undefined;

    const activeId =
      window.playerStore?.activeSegmentId ||
      window.playerStore?.state?.activeId;

    if (!activeId) return undefined;
    return this.state.tracks.find((t) => t.id === activeId);
  }

  /**
   * Creates a snapshot of track status mapping to track uncommitted changes.
   */
  private createStatusSnapshot(
    segments: TrackSegment[],
  ): Record<string, string> {
    const snapshot: Record<string, string> = {};
    segments.forEach((seg) => {
      snapshot[seg.id] =
        seg.isPublic || seg.status === "public" ? "public" : "private";
    });
    return snapshot;
  }

  private createTitleSnapshot(
    segments: TrackSegment[],
  ): Record<string, string> {
    const snapshot: Record<string, string> = {};
    segments.forEach((seg) => {
      snapshot[seg.id] = seg.title;
    });
    return snapshot;
  }

  /**
   * Emits custom event to notify UI binder of reactive state updates.
   */
  private notify(): void {
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("review-state-changed"));
    }
  }

  /**
   * Triggers global notification toast banners.
   */
  private showNotification(
    message: string,
    type: "success" | "info" | "error" = "info",
  ): void {
    if (typeof window !== "undefined" && window.toastStore) {
      window.toastStore.trigger(message, type);
    } else if (typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent("app-toast-trigger", {
          detail: { message, type },
        }),
      );
    }
  }

  // ---------------------------------------------------------------------------
  // Getters for Binder Expressions
  // ---------------------------------------------------------------------------

  get publicCount(): number {
    return this.state.tracks.filter((t) => t.isPublic).length;
  }

  get privateCount(): number {
    return this.state.tracks.filter((t) => !t.isPublic).length;
  }

  get hasUncommittedChanges(): boolean {
    return this.state.tracks.some((t) => {
      const orig = this.initialStatuses[t.id];
      const originalTitle = this.initialTitles[t.id];
      const current = t.isPublic ? "public" : "private";
      const changedStatus = orig !== current;
      const changedTitle = originalTitle !== t.title;
      return [changedTitle, changedStatus].some(Boolean);
    });
  }

  get isCurrentPublic(): boolean {
    return this.activeTrack?.isPublic ?? false;
  }

  get tracks(): TrackSegment[] {
    return this.state.tracks;
  }

  get isCommitModalOpen(): boolean {
    return this.state.isCommitModalOpen;
  }

  get isGraphDrawerOpen(): boolean {
    return this.state.isGraphDrawerOpen;
  }

  get isSubmitting(): boolean {
    return this.state.isSubmitting;
  }

  // ---------------------------------------------------------------------------
  // Store Actions & Mutations
  // ---------------------------------------------------------------------------

  public toggleStatus(): void {
    const track = this.activeTrack;
    if (!track) return;

    track.isPublic = !track.isPublic;
    track.status = track.isPublic ? "public" : "private";
    this.notify();
  }

  public syncTitle(newTitle: string): void {
    const track = this.activeTrack;
    if (!track) return;
    track.title = newTitle;
    this.notify();
  }

  public toggleCommitModal(isOpen?: boolean): void {
    this.state.isCommitModalOpen = isOpen ?? !this.state.isCommitModalOpen;
    this.notify();
  }

  public toggleGraphDrawer(isOpen?: boolean): void {
    this.state.isGraphDrawerOpen = isOpen ?? !this.state.isGraphDrawerOpen;
    this.notify();
  }

  /**
   * Sends complete segment objects to /api/commit-status
   */
  public async submitCommit(): Promise<void> {
    if (this.state.isSubmitting) return;

    try {
      this.state.isSubmitting = true;
      this.notify();

      // 1. Calculate IDs transitioning from private -> public
      const currentPrivateIds = Object.keys(this.initialStatuses).filter(
        (id) => this.initialStatuses[id] === "private",
      );

      const newPublicIds = this.state.tracks
        .filter((seg) => seg.isPublic)
        .map((seg) => seg.id);

      const changedStatus = currentPrivateIds.filter((id) =>
        newPublicIds.includes(id),
      );

      // 2. Spread full track objects ensuring status string aligns with isPublic
      const payloadSegments = this.state.tracks.map((t) => ({
        ...t,
        status: t.isPublic ? "public" : "private",
      }));

      // 3. Dispatch POST request
      const response = await fetch("/api/commit-status", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          segments: payloadSegments,
          changedStatus,
        }),
      });

      if (!response.ok) {
        throw new Error(`Commit status failed with status ${response.status}`);
      }

      await response.json();

      // 4. Reset snapshot reference
      this.initialStatuses = this.createStatusSnapshot(payloadSegments);

      // 5. Trigger notification toast
      this.showNotification("Changes committed successfully!", "success");
    } catch (error) {
      console.error("❌ Failed to submit commit status:", error);
      this.showNotification("Failed to commit changes", "error");
    } finally {
      this.state.isSubmitting = false;
      this.state.isCommitModalOpen = false;
      this.notify();
    }
  }
}

// Global Singleton Interface
declare global {
  interface Window {
    reviewStore?: ReviewStore;
  }
}

export function initReviewStore(initialSegments: any[] = []): ReviewStore {
  const store = new ReviewStore(initialSegments);
  if (typeof window !== "undefined") {
    window.reviewStore = store;
  }
  return store;
}
