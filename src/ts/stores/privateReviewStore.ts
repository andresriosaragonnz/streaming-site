import { Segment } from "../types.js";
import { parseSegmentsData } from "../utils/segmentUtils.js";
import {
  StatusSnapshot,
  createStatusSnapshot,
  hasStatusChanged,
  getChangedSegments,
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
          this.$store.review.segments = initialSegments;
          this.$store.review.currentIndex = 0;

          // Capture initial status snapshot
          this.$store.review.initialStatuses =
            createStatusSnapshot(initialSegments);

          console.log("✅ Private workspace store hydrated successfully.");

          if (typeof window.setupMediaPlayback === "function") {
            window.setupMediaPlayback(this.active, this.$store.review.mode);
          }
        }
      });

      this.$watch("$store.review.currentIndex", () => {
        this.$nextTick(() => {
          if (typeof window.setupMediaPlayback === "function") {
            window.setupMediaPlayback(this.active, this.$store.review.mode);
          }
        });
      });

      this.$watch("$store.review.mode", () => {
        this.$nextTick(() => {
          if (typeof window.setupMediaPlayback === "function") {
            window.setupMediaPlayback(this.active, this.$store.review.mode);
          }
        });
      });
    },

    get active(): Segment {
      const store = Alpine.store("review");
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

  Alpine.store("toast", {
    show: false,
    message: "",
    type: "success" as "success" | "error" | "info",
    timeoutId: null as any,

    trigger(
      message: string,
      type: "success" | "error" | "info" = "success",
      duration = 3000,
    ) {
      // Clear any existing timeout if a new toast arrives quickly
      if (this.timeoutId) {
        clearTimeout(this.timeoutId);
      }

      this.message = message;
      this.type = type;
      this.show = true;

      this.timeoutId = setTimeout(() => {
        this.show = false;
      }, duration);
    },

    dismiss() {
      this.show = false;
    },
  });

  // 2. REGISTER DEDICATED PRIVATE REVIEW STORE
  Alpine.store("review", {
    segments: [] as Segment[],
    initialStatuses: {} as StatusSnapshot,
    mode: true,
    changed: false,
    currentIndex: 0,
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

    togleMode() {
      this.mode = !this.mode;
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
