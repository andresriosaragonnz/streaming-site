import { Segment } from "../types.js";
import { parseSegmentsData } from "../utils/segmentUtils.js";
import {
  StatusSnapshot,
  createStatusSnapshot,
  hasStatusChanged,
  filterSegmentsByStatus,
} from "../utils/statusUtils.js";

export function initPrivateAlpineStores(Alpine: any): void {
  // 1. REGISTER privateWorkspace DATA COMPONENT
  Alpine.data("privateWorkspace", () => ({
    init(this: any) {
      this.$nextTick(() => {
        const dataEl = document.getElementById("studio-segments-data");
        if (dataEl && dataEl.textContent) {
          const initialSegments = parseSegmentsData(dataEl.textContent);

          // Populate segments
          this.$store.player.segments = initialSegments;
          this.$store.review.segments = initialSegments;
          this.$store.player.currentIndex = 0;

          // Capture initial status snapshot
          this.$store.review.initialStatuses =
            createStatusSnapshot(initialSegments);

          console.log("✅ Private workspace store hydrated successfully.");

          if (typeof window.setupMediaPlayback === "function") {
            window.setupMediaPlayback(
              this.active,
              this.$store.review.mode,
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
          cardImage: "",
          status: "private",
        };
      }
      return store.segments[store.currentIndex];
    },
  }));

  // 2. REGISTER DEDICATED PRIVATE REVIEW STORE
  Alpine.store("review", {
    segments: [] as Segment[],
    initialStatuses: {} as StatusSnapshot,
    mode: true,
    changed: false,
    isCommitModalOpen: false,

    openCommitModal() {
      if (this.changed) {
        this.isCommitModalOpen = true;
      }
    },

    closeCommitModal() {
      this.isCommitModalOpen = false;
    },

    async submitCommit() {
      try {
        // 2. Send POST request to Hono /api/commit-status
        const currentPrivate = Object.keys(this.initialStatuses).filter(
          (key) => {
            return this.initialStatuses[key] === "private";
          },
        );
        const newPublic = this.segments
          .filter((seg: any) => seg.status === "public")
          .map((seg: any) => seg.id);
        const changedStatus = currentPrivate.filter((id) =>
          newPublic.includes(id),
        );
        const response = await fetch("/api/commit-status", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ segments: this.segments, changedStatus }),
        });
        if (!response.ok) {
          throw new Error(
            `Commit status failed with status ${response.status}`,
          );
        }
        const data = await response.json();
        Alpine.store("toast").trigger(
          "Changes committed successfully!",
          "success",
        );
        console.log("✅ Commit successful:", data);

        // 2. RESET STATE AFTER COMMIT
        // Re-capture the initial status snapshot so hasStatusChanged evaluates to false
        this.initialStatuses = createStatusSnapshot(this.segments);

        // Reset change flag
        this.changed = false;
      } catch (error) {
        console.error("❌ Failed to submit commit status:", error);
      } finally {
        this.closeCommitModal();
      }
    },

    toggleStatus(targetIdx: number) {
      if (this.segments[targetIdx]) {
        const currentStatus = this.segments[targetIdx].status;
        this.segments[targetIdx].status =
          currentStatus === "public" ? "private" : "public";
        this.broadcastChange(this.segments[targetIdx]);
        this.changed = hasStatusChanged(this.segments, this.initialStatuses);
      }
    },

    getPublicSegments(): Segment[] {
      return filterSegmentsByStatus(this.segments, "public");
    },

    gePrivateSegments(): Segment[] {
      return filterSegmentsByStatus(this.segments, "private");
    },
    getCount(): string {
      return `public:${filterSegmentsByStatus(this.segments, "public").length}`;
    },

    getCountPrivate(): string {
      return `private:${filterSegmentsByStatus(this.segments, "private").length}`;
    },

    syncStore(targetIdx: number, updatedTitle: string) {
      if (this.segments[targetIdx]) {
        this.segments[targetIdx].title = updatedTitle;
        this.broadcastChange(this.segments[targetIdx]);
        this.changed = true;
      }
    },

    broadcastChange(trackItem: Segment) {
      console.log("📡 Private State Synchronized:", JSON.stringify(trackItem));
    },
  });
}
