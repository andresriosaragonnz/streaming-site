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

          // Initial HLS boot run
          this.setupMediaPlayback();
        }
      });

      // Reactive Watcher: Updates the HLS feed safely when the active card selection changes
      this.$watch("$store.review.currentIndex", () => {
        this.$nextTick(() => this.setupMediaPlayback());
      });
      this.$watch("$store.review.mode", () => {
        this.$nextTick(() => this.setupMediaPlayback());
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

    setupMediaPlayback() {
      const video = document.getElementById("r2-stream-player");
      const audio = document.getElementById("r2-audio-player");

      // Stop ongoing items to prevent multiple elements playing back simultaneously
      if (video) {
        video.pause();
        video.src = "";
      }
      if (audio) {
        audio.pause();
        audio.src = "";
      }
      if (window.activeHlsInstance) {
        window.activeHlsInstance.destroy();
        window.activeHlsInstance = null;
      }

      if (!this.active.source) return;

      const currentMode = Alpine.store("review").mode;

      const streamUrl = this.active.source;
      const streamUrlMp3 = this.active.sourceMp3;
      // 1. VIDEO MODE ACTIVE: Handle HLS Stream Rendering Pipeline (.m3u8)
      if (currentMode) {
        if (!video) return;

        if (video.canPlayType("application/vnd.apple.mpegurl")) {
          video.src = streamUrl;
        } else if (window.Hls && window.Hls.isSupported()) {
          const hls = new window.Hls({ maxMaxBufferLength: 10 });
          hls.loadSource(streamUrl);
          hls.attachMedia(video);
          window.activeHlsInstance = hls;
        }
      }
      // 2. AUDIO MODE ACTIVE: Point to Cloudflare R2 Remote Storage
      else {
        if (!audio) return;
        console.log({ streamUrlMp3 });

        // Construct the absolute R2 endpoint URL matching your exact storage directory layout
        const audioUrl = `${streamUrlMp3}`;

        console.log("🎵 Streaming audio segment from R2:", audioUrl);

        audio.src = audioUrl;
        audio.load();
      }
    },
  }));
  Alpine.store("review", {
    segments: [],
    mode: true,
    currentIndex: 0,
    togleMode() {
      const reviewStore = Alpine.store("review");

      const currentMode = this.mode;

      this.mode = !currentMode;
    },
  });
  // 2. REGISTER THE CENTRAL PLAYLIST STORE
  Alpine.store("playlists", {
    playlists: {
      favorites: [],
      shared: [],
    },

    // 1. GENERATE & COPY LINK TO CLIPBOARD (Dev-Server & Static Safe)
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

        // Route the share link directly to your central playlist viewer page
        const shareUrl = `${window.location.origin}/playlist/index.html?share=${base64UrlSafe}`;
        console.log({ base64UrlSafe });

        navigator.clipboard
          .writeText(shareUrl)
          .then(() => {
            alert("copied to clipboard");
            console.log(
              "🔗 Copied explicit static link to clipboard:",
              shareUrl,
            );
          })
          .catch((err) => {
            console.error("❌ Failed to copy link to clipboard: ", err);
          });
      });
    },

    // Bridge Method: Grabs whatever is currently active and pushes it
    addActiveToPlaylist(playlistName) {
      const reviewStore = Alpine.store("review");
      const activeSegment = reviewStore.segments[reviewStore.currentIndex];

      if (!activeSegment || !activeSegment.id) {
        console.warn("⚠️ No active segment available to add.");
        return;
      }

      this.addToPlaylist(activeSegment.id, playlistName);
    },

    addToPlaylist(segmentId, playlistName) {
      if (!this.playlists[playlistName]) {
        this.playlists[playlistName] = [];
      }
      console.log({ segmentId, playlistName });
      // Prevent duplicates in the same playlist
      if (this.playlists[playlistName].includes(segmentId)) {
        console.warn(
          `⚠️ Segment ${segmentId} already exists in ${playlistName}`,
        );
        return;
      }

      this.playlists[playlistName].push(segmentId);
      console.log(
        `📡 Added segment ${segmentId} to ${playlistName}. Current state:`,
        JSON.stringify(this.playlists),
      );
    },
  });
});

// =========================================================================
// STEP 2: Put your Alpine script loading/injection block right here
// =========================================================================
// Inject the hls.js decoder script node right before booting Alpine
const hlsScript = document.createElement("script");
hlsScript.src = "https://cdn.jsdelivr.net/npm/hls.js@1";
document.head.appendChild(hlsScript);

const script = document.createElement("script");
script.src = "/js/alpine.js";
script.defer = true;
document.head.appendChild(script);
