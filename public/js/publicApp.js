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
        }
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
// STEP 2: Put your Alpine script loading/injection block right here
// =========================================================================
// (Paste the exact code you are using to load/trigger alpine.js below)
const script = document.createElement("script");
script.src = "/js/alpine.js";
script.defer = true;
document.head.appendChild(script);
