// public/js/app.js
import { registerCarousel } from "./carousel.js";
document.addEventListener("alpine:init", () => {
  const Alpine = window.Alpine;
  registerCarousel(Alpine);
  Alpine.data("studioWorkspace", () => ({
    init() {
      this.$nextTick(() => {
        const dataEl = document.getElementById("studio-segments-data");
        if (dataEl) {
          const initialSegments = JSON.parse(dataEl.textContent);

          // Populate segments
          this.$store.review.segments = initialSegments;
          this.$store.review.currentIndex = 0;

          // Capture initial status snapshot (keyed by ID or array index)
          this.$store.review.initialStatuses = initialSegments.reduce(
            (acc, seg, idx) => {
              acc[seg.id ?? idx] = seg.status;
              return acc;
            },
            {},
          );

          console.log("✅ Private workspace store hydrated successfully.");

          if (window.setupMediaPlayback) {
            window.setupMediaPlayback(this.active, this.$store.review.mode);
          }
        }
      });

      this.$watch("$store.review.currentIndex", () => {
        this.$nextTick(
          () =>
            window.setupMediaPlayback &&
            window.setupMediaPlayback(this.active, this.$store.review.mode),
        );
      });
      this.$watch("$store.review.mode", () => {
        this.$nextTick(
          () =>
            window.setupMediaPlayback &&
            window.setupMediaPlayback(this.active, this.$store.review.mode),
        );
      });
    },

    get active() {
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

  // REGISTER DEDICATED PRIVATE ACTIONS REGION
  Alpine.store("review", {
    segments: [],
    initialStatuses: {},
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
      const changed = this.getChangedSegments();
      console.log("🚀 Committing changes:", changed);

      // Update initialStatuses snapshot to match new committed values
      changed.forEach((seg, idx) => {
        const key = seg.id ?? idx;
        this.initialStatuses[key] = seg.status;
      });

      this.closeCommitModal();
    },

    togleMode() {
      this.mode = !this.mode;
    },

    toggleStatus(targetIdx) {
      if (this.segments[targetIdx]) {
        const currentStatus = this.segments[targetIdx].status;
        this.segments[targetIdx].status =
          currentStatus === "public" ? "private" : "public";
        this.broadcastChange(this.segments[targetIdx]);
      }
    },

    hasStatusChanged() {
      return this.segments.some((seg, idx) => {
        const key = seg.id ?? idx;
        return seg.status !== this.initialStatuses[key];
      });
    },

    getPublicSegments() {
      const changed = this.segments.filter((seg) => seg.status === "public");
      return changed;
    },

    getCount() {
      return `public:${this.segments.filter((seg) => seg.status === "public")?.length}`;
    },

    getCountPrivate() {
      return `private:${this.segments.filter((seg) => seg.status === "private").length}`;
    },

    syncStore(targetIdx, updatedTitle) {
      if (this.segments[targetIdx]) {
        this.segments[targetIdx].title = updatedTitle;
        this.broadcastChange(this.segments[targetIdx]);
      }
    },

    broadcastChange(trackItem) {
      console.log("📡 Private State Synchronized:", JSON.stringify(trackItem));
    },
  });
});

const mediaEngineScript = document.createElement("script");
mediaEngineScript.src = "/js/mediaInit.js";

// Only boot Alpine AFTER your media playback engine has successfully mounted
mediaEngineScript.onload = () => {
  console.log(
    "⚡ Option B Media Engine loaded. Booting Alpine wrapper next...",
  );
  const script = document.createElement("script");
  script.src = "/js/alpine.js";
  script.defer = true;
  document.head.appendChild(script);
};

document.head.appendChild(mediaEngineScript);
