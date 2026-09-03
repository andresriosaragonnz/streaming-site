// src/client/stores/reviewStore.ts

export interface TrackSegment {
  id: string;
  title: string;
  status: "public" | "private";
  isPublic: boolean;
  [key: string]: any;
}

export function createStatusSnapshot(
  segments: TrackSegment[],
): Record<string, string> {
  const snapshot: Record<string, string> = {};
  segments.forEach((seg) => {
    snapshot[seg.id] =
      seg.isPublic || seg.status === "public" ? "public" : "private";
  });
  return snapshot;
}

export function createReviewStore(initialSegments: any[] = []) {
  // Preserve full segment objects while assigning computed isPublic and status flags
  const initialReviewTracks: TrackSegment[] = initialSegments.map((s) => {
    const isPublic = s.status === "public" || Boolean(s.isPublic);
    return {
      ...s,
      title: s.title || "",
      isPublic,
      status: isPublic ? "public" : "private",
    };
  });

  // Capture initial status snapshot to track uncommitted changes
  let initialStatuses = createStatusSnapshot(initialReviewTracks);

  const rawState = {
    tracks: initialReviewTracks,
    isCommitModalOpen: false,
    isGraphDrawerOpen: false,
    isSubmitting: false,
    notificationMessage: "",
    notificationType: "info" as "info" | "success" | "error",
  };

  const notify = () => {
    window.dispatchEvent(new CustomEvent("review-state-changed"));
  };

  const state = new Proxy(rawState, {
    set(target, prop, value) {
      (target as any)[prop] = value;
      notify();
      return true;
    },
  });

  return {
    state,

    get publicCount(): number {
      return state.tracks.filter((t) => t.isPublic).length;
    },

    get privateCount(): number {
      return state.tracks.filter((t) => !t.isPublic).length;
    },

    get hasUncommittedChanges(): boolean {
      return state.tracks.some((t) => {
        const orig = initialStatuses[t.id];
        const current = t.isPublic ? "public" : "private";
        return orig !== current;
      });
    },

    /**
     * Triggers notification toast banners
     */
    showNotification(
      message: string,
      type: "success" | "info" | "error" = "info",
    ): void {
      window.dispatchEvent(
        new CustomEvent("app-toast-trigger", {
          detail: { message, type },
        }),
      );
    },

    toggleStatus(index: number) {
      if (!state.tracks[index]) return;
      const track = state.tracks[index];
      track.isPublic = !track.isPublic;
      track.status = track.isPublic ? "public" : "private";
      notify();
    },

    syncStore(index: number, newTitle: string) {
      if (!state.tracks[index]) return;
      state.tracks[index].title = newTitle;
      notify();
    },

    /**
     * Sends complete segment objects to /api/commit-status and notifies user via toast
     */
    async submitCommit() {
      if (state.isSubmitting) return;

      try {
        state.isSubmitting = true;

        // 1. Calculate IDs transitioning from private -> public
        const currentPrivateIds = Object.keys(initialStatuses).filter(
          (id) => initialStatuses[id] === "private",
        );

        const newPublicIds = state.tracks
          .filter((seg) => seg.isPublic)
          .map((seg) => seg.id);

        const changedStatus = currentPrivateIds.filter((id) =>
          newPublicIds.includes(id),
        );

        // 2. Spread full track objects ensuring status string aligns with isPublic
        const payloadSegments = state.tracks.map((t) => ({
          ...t,
          status: t.isPublic ? "public" : "private",
        }));

        console.log("📤 [Commit] Sending complete store payload:", {
          totalSegments: payloadSegments.length,
          changedStatusCount: changedStatus.length,
          changedStatus,
        });

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
          throw new Error(
            `Commit status failed with status ${response.status}`,
          );
        }

        const data = await response.json();
        console.log("✅ Commit successful:", data);

        // 4. Reset snapshot reference
        initialStatuses = createStatusSnapshot(payloadSegments);

        // 5. Trigger notification toast
        this.showNotification("Changes committed successfully!", "success");
      } catch (error) {
        console.error("❌ Failed to submit commit status:", error);
        this.showNotification("Failed to commit changes", "error");
      } finally {
        state.isSubmitting = false;
        state.isCommitModalOpen = false;
        notify();
      }
    },
  };
}
