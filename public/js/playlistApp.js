// public/js/publicApp.js

document.addEventListener("alpine:init", () => {
  const Alpine = window.Alpine;

  Alpine.data("studioWorkspace", () => ({
    init() {
      this.$nextTick(() => {
        const dataEl = document.getElementById("studio-segments-data");
        // 1. Get query string params from the address bar
        const urlParams = new URLSearchParams(window.location.search);
        const sharedData = urlParams.get("share");

        if (!sharedData) {
          this.loading = false;
          return;
        }
        if (dataEl) {
          const allSegments = JSON.parse(dataEl.textContent);
          let base64 = sharedData.replace(/-/g, "+").replace(/_/g, "/");
          while (base64.length % 4) base64 += "=";
          const decodedIds = atob(base64).split(",");

          const filteredSegments = decodedIds
            .map((id) => allSegments.find((item) => item.id === id))
            .filter((item) => item !== undefined);
          this.$store.review.segments = filteredSegments;
          this.$store.review.currentIndex = 0;
          console.log("✅ Public player workspace hydrated successfully.");

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
          status: "public",
        };
      }
      return store.segments[store.currentIndex];
    },
  }));

  Alpine.store("review", {
    segments: [],
    mode: true,
    currentIndex: 0,

    togleMode() {
      this.mode = !this.mode;
    },
  });

  // REGISTER DEDICATED PUBLIC ACTIONS REGION
  Alpine.store("playlists", {
    playlists: { favorites: [], shared: [] },

    generateShareLink(playlistName) {
      navigator.clipboard.writeText("").then(() => {
        const ids = this.playlists[playlistName];
        if (!ids || ids.length === 0) {
          alert("⚠️ Cannot share an empty playlist.");
          return;
        }

        const base64UrlSafe = btoa(ids.join(","))
          .replace(/\+/g, "-")
          .replace(/\//g, "_")
          .replace(/=+$/, "");

        const shareUrl = `${window.location.origin}/playlist/index.html?share=${base64UrlSafe}`;
        navigator.clipboard.writeText(shareUrl).then(() => {
          alert("copied to clipboard");
        });
      });
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
