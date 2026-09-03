window.setupMediaPlayback = function (
  activeItem,
  currentMode,
  shouldPlay = true,
  seekTime = 0,
) {
  const video = document.getElementById("r2-stream-player");
  const audio = document.getElementById("r2-audio-player");

  const safePlay = async (mediaEl) => {
    // 🛑 Strictly enforce user click requirement
    if (!shouldPlay) return;

    try {
      await mediaEl.play();
    } catch (err) {
      if (err.name !== "AbortError") {
        console.warn("Autoplay prevented:", err);
      }
    }
  };

  const isMobile = () =>
    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent,
    ) || window.innerWidth <= 768;

  const isFullscreen = () =>
    Boolean(
      document.fullscreenElement ||
      document.webkitFullscreenElement ||
      (video && video.webkitDisplayingFullscreen),
    );

  const triggerNext = () => {
    console.log("🏁 Playback ended. Auto-advancing...");
    if (window.playerStore) {
      window.playerStore.nextSegment();
    }
  };

  if (!activeItem) return;

  // Select cardVideoSource on mobile whenever not in fullscreen
  const useMobileVideo =
    isMobile() && !isFullscreen() && Boolean(activeItem.cardVideoSource);

  const streamUrl = useMobileVideo
    ? activeItem.cardVideoSource
    : activeItem.source;
  const streamUrlMp3 = activeItem.sourceMp3;

  if (!streamUrl) return;

  // Reset ongoing streams
  if (video) {
    if (video._onEndedHandler)
      video.removeEventListener("ended", video._onEndedHandler);
    video.pause();
    if (video.src && video.src.startsWith("blob:"))
      URL.revokeObjectURL(video.src);
    video.src = "";
    video.removeAttribute("src");
    video.load();
  }

  if (audio) {
    if (audio._onEndedHandler)
      audio.removeEventListener("ended", audio._onEndedHandler);
    audio.pause();
  }

  if (window.activeCustomMseController) {
    window.activeCustomMseController.abort();
    window.activeCustomMseController = null;
  }

  // Restore playback position seamlessly across source switches
  const restoreSeekTime = (mediaEl) => {
    if (seekTime > 0) {
      const applyTime = () => {
        mediaEl.currentTime = seekTime;
      };
      if (mediaEl.readyState >= 1) {
        applyTime();
      } else {
        mediaEl.addEventListener("loadedmetadata", applyTime, { once: true });
      }
    }
  };

  // 1. VIDEO MODE ACTIVE
  if (currentMode) {
    if (!video) return;

    video._onEndedHandler = triggerNext;
    video.addEventListener("ended", video._onEndedHandler);

    // Dynamic stream swapper: toggles between 1080p (Fullscreen) and cardVideoSource (Inline Mobile)
    const handleFullscreenChange = () => {
      const currentTime = video.currentTime || 0;
      const currentlyFullscreen = isFullscreen();

      if (currentlyFullscreen && useMobileVideo) {
        console.log("📺 Entering Fullscreen: Upgrading to 1080p stream.");
        window.setupMediaPlayback(activeItem, currentMode, true, currentTime);
      } else if (
        !currentlyFullscreen &&
        !useMobileVideo &&
        activeItem.cardVideoSource &&
        isMobile()
      ) {
        console.log(
          "📱 Exiting Fullscreen: Reverting to lightweight cardVideoSource stream.",
        );
        window.setupMediaPlayback(activeItem, currentMode, true, currentTime);
      }
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange, {
      once: true,
    });
    video.addEventListener("webkitbeginfullscreen", handleFullscreenChange, {
      once: true,
    });
    video.addEventListener("webkitendfullscreen", handleFullscreenChange, {
      once: true,
    });

    // Native HLS / Direct MP4 Playback
    if (
      video.canPlayType("application/vnd.apple.mpegurl") ||
      streamUrl.endsWith(".mp4")
    ) {
      video.src = streamUrl;
      restoreSeekTime(video);
      if (shouldPlay) {
        safePlay(video);
      }
      return;
    }

    // Custom MSE Pipeline
    if (window.MediaSource) {
      const mediaSource = new MediaSource();
      video.src = URL.createObjectURL(mediaSource);

      restoreSeekTime(video);
      if (shouldPlay) {
        safePlay(video);
      }

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
    restoreSeekTime(audio);
    if (shouldPlay) {
      safePlay(audio);
    }
  }
};
