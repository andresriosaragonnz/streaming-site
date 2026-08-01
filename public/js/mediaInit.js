window.setupMediaPlayback = function (activeItem, currentMode) {
  const video = document.getElementById("r2-stream-player");
  const audio = document.getElementById("r2-audio-player");

  // Reset ongoing streams to prevent memory leaks and buffer collisions
  if (video) {
    video.pause();
    if (video.src.startsWith("blob:")) {
      URL.revokeObjectURL(video.src);
    }
    video.src = "";
    video.removeAttribute("src");
    video.load();
  }
  if (audio) {
    audio.pause();
    audio.src = "";
  }

  // Clear running custom controller tracking instances
  if (window.activeCustomMseController) {
    window.activeCustomMseController.abort();
    window.activeCustomMseController = null;
  }

  if (!activeItem || !activeItem.source) return;

  const streamUrl = activeItem.source;
  const streamUrlMp3 = activeItem.sourceMp3;

  // 1. VIDEO MODE ACTIVE: Handle custom light fMP4 playlist streaming
  if (currentMode) {
    if (!video) return;

    if (video.canPlayType("application/vnd.apple.mpegurl")) {
      video.src = streamUrl;
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
        } catch (err) {
          console.error("❌ MSE processing error:", err);
        }
      });
    }
  }
  // 2. AUDIO MODE ACTIVE: Stream absolute full-length MP3
  else {
    if (!audio || !streamUrlMp3) return;
    console.log("🎵 Streaming audio file from R2:", streamUrlMp3);
    audio.src = streamUrlMp3;
    audio.load();
  }
};
