// public/js/app.js

// =========================================================================
// STEP 1: Register the listener first so it's ready when Alpine boots
// =========================================================================
document.addEventListener("alpine:init", () => {
  const Alpine = window.Alpine;

  // 1. REGISTER THE STUDIO WORKSPACE COMPONENT
  Alpine.data("studioWorkspace", () => ({
    init() {
      this.$nextTick(() => {
        const dataEl = document.getElementById("studio-segments-data");
        if (dataEl) {
          this.$store.review.segments = JSON.parse(dataEl.textContent);
          this.$store.review.currentIndex = 0;
          console.log("✅ Store successfully hydrated from DOM element data.");

          this.setupHlsPlayback();
        }
      });

      this.$watch("$store.review.currentIndex", () => {
        this.$nextTick(() => this.setupHlsPlayback());
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

    setupHlsPlayback() {
      const video = document.getElementById("r2-stream-player");
      if (!video || !this.active.source) return;

      if (window.activeHlsInstance) {
        window.activeHlsInstance.destroy();
        window.activeHlsInstance = null;
      }

      const streamUrl = this.active.source;

      if (video.canPlayType("application/vnd.apple.mpegurl")) {
        video.src = streamUrl;
      } else if (window.Hls && window.Hls.isSupported()) {
        const hls = new window.Hls({
          maxMaxBufferLength: 10,
        });
        hls.loadSource(streamUrl);
        hls.attachMedia(video);
        window.activeHlsInstance = hls;
      } else {
        console.error(
          "❌ HLS.js is not loaded or not supported by this browser.",
        );
      }
    },
  }));

  // 2. REGISTER THE CENTRAL SELECTION & VISIBILITY STORE
  Alpine.store("review", {
    segments: [],
    currentIndex: 0,

    toggleStatus(targetIdx) {
      if (this.segments[targetIdx]) {
        const currentStatus = this.segments[targetIdx].status;
        this.segments[targetIdx].status =
          currentStatus === "public" ? "private" : "public";
        this.broadcastChange(this.segments[targetIdx]);
      }
    },

    syncStore(targetIdx, updatedTitle) {
      if (this.segments[targetIdx]) {
        this.segments[targetIdx].title = updatedTitle;
        this.broadcastChange(this.segments[targetIdx]);
      }
    },

    broadcastChange(trackItem) {
      console.log("📡 State Synchronized:", JSON.stringify(trackItem));
    },
  });
});

// =========================================================================
// STEP 2: Sequential Script Loading to Eliminate Race Conditions
// =========================================================================
const hlsScript = document.createElement("script");
hlsScript.src = "https://cdn.jsdelivr.net/npm/hls.js@1";

// Only inject Alpine AFTER hls.js has explicitly loaded and executed
hlsScript.onload = () => {
  console.log("📦 HLS.js successfully loaded. Booting Alpine wrapper next...");
  const script = document.createElement("script");
  script.src = "/js/alpine.js";
  script.defer = true;
  document.head.appendChild(script);
};

document.head.appendChild(hlsScript);
