window.setupMediaPlayback = function (
  activeItem,
  currentMode,
  isInitialLoad = false,
) {
  const video = document.getElementById("r2-stream-player");
  const audio = document.getElementById("r2-audio-player");

  const safePlay = async (mediaEl) => {
    try {
      await mediaEl.play();
    } catch (err) {
      if (err.name !== "AbortError") {
        console.warn("Autoplay prevented:", err);
      }
    }
  };

  // Auto-advance callback (ALWAYS auto-plays next tracks)
  const triggerNext = () => {
    console.log("🏁 Playback ended. Auto-advancing...");
    if (window.Alpine && window.Alpine.store("review")) {
      window.Alpine.store("review").nextSegment();
    }
  };

  // Reset ongoing streams
  if (video) {
    if (video._onEndedHandler)
      video.removeEventListener("ended", video._onEndedHandler);
    video.pause();
    if (video.src.startsWith("blob:")) URL.revokeObjectURL(video.src);
    video.src = "";
    video.removeAttribute("src");
    video.load();
  }

  if (audio) {
    if (audio._onEndedHandler)
      audio.removeEventListener("ended", audio._onEndedHandler);
    audio.pause();
    audio.src = "";
  }

  if (window.activeCustomMseController) {
    window.activeCustomMseController.abort();
    window.activeCustomMseController = null;
  }

  if (!activeItem || !activeItem.source) return;

  const streamUrl = activeItem.source;
  const streamUrlMp3 = activeItem.sourceMp3;

  // 1. VIDEO MODE ACTIVE
  if (currentMode) {
    if (!video) return;

    video._onEndedHandler = triggerNext;
    video.addEventListener("ended", video._onEndedHandler);

    if (video.canPlayType("application/vnd.apple.mpegurl")) {
      video.src = streamUrl;
      // Only play automatically if this is NOT the initial page load
      if (!isInitialLoad) {
        video.addEventListener("canplay", () => safePlay(video), {
          once: true,
        });
      }
      return;
    }

    if (window.MediaSource) {
      const mediaSource = new MediaSource();
      video.src = URL.createObjectURL(mediaSource);

      const controller = new AbortController();
      window.activeCustomMseController = controller;

      mediaSource.addEventListener("sourceopen", async () => {
        try {
          const res = await fetch(streamUrl, { signal: controller.signal });
          const text = await res.text();
          const baseUrl = streamUrl.substring(
            0,
            streamUrl.lastIndexOf("/") + 1,
          );

          const segments = text
            .split("\n")
            .map((line) => line.trim())
            .filter((line) => line && !line.startsWith("#"));

          if (segments.length === 0) return;

          const sourceBuffer = mediaSource.addSourceBuffer(
            'video/mp4; codecs="avc1.42E01E, mp4a.40.2"',
          );
          let index = 0;

          const queueAndFetchNext = async () => {
            if (
              index >= segments.length ||
              mediaSource.readyState !== "open" ||
              controller.signal.aborted
            ) {
              if (
                index >= segments.length &&
                mediaSource.readyState === "open"
              ) {
                mediaSource.endOfStream();
              }
              return;
            }

            try {
              const segmentUrl = segments[index].startsWith("http")
                ? segments[index]
                : baseUrl + segments[index];
              const segRes = await fetch(segmentUrl, {
                signal: controller.signal,
              });
              const chunk = await segRes.arrayBuffer();

              sourceBuffer.addEventListener(
                "updateend",
                function onUpdateEnd() {
                  sourceBuffer.removeEventListener("updateend", onUpdateEnd);
                  index++;
                  queueAndFetchNext();
                },
                { once: true },
              );

              sourceBuffer.appendBuffer(chunk);
            } catch (err) {
              console.warn("⚠️ MSE download chain interrupted:", err);
            }
          };

          await queueAndFetchNext();

          // Only play automatically if NOT initial load
          if (!isInitialLoad) {
            video.addEventListener("canplay", () => safePlay(video), {
              once: true,
            });
          }
        } catch (err) {
          console.error("❌ MSE processing error:", err);
        }
      });
    }
  }
  // 2. AUDIO MODE ACTIVE
  else {
    if (!audio || !streamUrlMp3) return;

    audio._onEndedHandler = triggerNext;
    audio.addEventListener("ended", audio._onEndedHandler);

    audio.src = streamUrlMp3;
    audio.load();

    // Only play automatically if NOT initial load
    if (!isInitialLoad) {
      audio.addEventListener("canplay", () => safePlay(audio), { once: true });
    }
  }
};
