import { Segment } from "../types.js";
import { getActiveSegment, parseSegmentsData } from "../utils/segmentUtils.js";
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
          cardImage: "/screenshots/card/card-fallback.jpg",
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
    currentIndex: 0,
    isCommitModalOpen: false,

    openCommitModal() {
      if (this.hasStatusChanged()) {
        this.isCommitModalOpen = true;
      }
    },

    closeCommitModal() {
      this.isCommitModalOpen = false;
    },

    submitCommit() {
      const changed = getChangedSegments(this.segments, this.initialStatuses);
      console.log("🚀 Committing changes:", changed);

      // Update initialStatuses snapshot to match new committed values
      changed.forEach((seg, idx) => {
        const key = seg.id ?? idx.toString();
        this.initialStatuses[key] = seg.status;
      });

      this.closeCommitModal();
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
      }
    },

    hasStatusChanged(): boolean {
      return hasStatusChanged(this.segments, this.initialStatuses);
    },

    getPublicSegments(): Segment[] {
      return filterSegmentsByStatus(this.segments, "public");
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
      }
    },

    broadcastChange(trackItem: Segment) {
      console.log("📡 Private State Synchronized:", JSON.stringify(trackItem));
    },
  });
}
