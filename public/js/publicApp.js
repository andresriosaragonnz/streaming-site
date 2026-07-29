// public/js/publicApp.js
import { registerCarousel } from "./carousel.js";
document.addEventListener("alpine:init", () => {
  const Alpine = window.Alpine;
  registerCarousel(Alpine);
  Alpine.data("studioWorkspace", () => ({
    init() {
      this.$nextTick(() => {
        const dataEl = document.getElementById("studio-segments-data");
        if (dataEl) {
          this.$store.review.segments = JSON.parse(dataEl.textContent);
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

        const shareUrl = `${window.location.origin}/playlist?share=${base64UrlSafe}`;
        navigator.clipboard.writeText(shareUrl).then(() => {
          alert("copied to clipboard");
        });
      });
    },

    addActiveToPlaylist(playlistName) {
      const reviewStore = Alpine.store("review");
      const activeSegment = reviewStore.segments[reviewStore.currentIndex];
      if (activeSegment && activeSegment.id) {
        this.addToPlaylist(activeSegment.id, playlistName);
      }
    },

    addToPlaylist(segmentId, playlistName) {
      if (!this.playlists[playlistName]) this.playlists[playlistName] = [];
      if (this.playlists[playlistName].includes(segmentId)) return;
      this.playlists[playlistName].push(segmentId);
      console.log(`📡 Playlist ${playlistName} updated locally.`);
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
