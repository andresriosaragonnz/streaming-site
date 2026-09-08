// =============================================================================
// Decoupled Media Controller (Audio + Video Sync + Adaptive Resolution)
// =============================================================================

export type VideoQuality = "1080p" | "480p";

interface AdaptiveMediaSegment {
  id: string;
  sourceMp3: string;
  sourceVideo1080p?: string;
  sourceVideo480p?: string;
  sourceVideo?: string; // Fallback
}

/**
 * Halts playback across all native media elements.
 */
export function stopPlayback(): void {
  const audioEl = document.getElementById(
    "r2-audio-player",
  ) as HTMLAudioElement | null;
  const videoEl = document.getElementById(
    "r2-video-player",
  ) as HTMLVideoElement | null;

  if (audioEl) audioEl.pause();
  if (videoEl) videoEl.pause();

  window.playerStore?.setPlaying(false);
}

/**
 * Determines optimal video resolution based on viewport width & fullscreen state.
 * - Mobile web view (< 768px portrait/inline) -> 480p
 * - Desktop or Mobile Fullscreen -> 1080p
 */
export function getTargetQuality(): VideoQuality {
  const isMobileViewport = window.innerWidth < 768;
  const isFullscreen = Boolean(
    document.fullscreenElement ||
    (document as any).webkitFullscreenElement ||
    (document as any).msFullscreenElement,
  );
  if (isMobileViewport && !isFullscreen) {
    return "480p";
  }
  return "1080p";
}

/**
 * Resolves the appropriate video URL for a segment based on requested quality.
 */
export function getSegmentVideoSource(
  segment: AdaptiveMediaSegment,
  quality: VideoQuality,
): string {
  if (quality === "480p" && segment.sourceVideo480p) {
    return segment.sourceVideo480p;
  }
  return segment.sourceVideo1080p || segment.sourceVideo || "";
}

/**
 * Updates video source seamlessly while preserving current playback position.
 */
export function syncVideoSource(quality?: VideoQuality): void {
  const videoEl = document.getElementById(
    "r2-video-player",
  ) as HTMLVideoElement | null;
  const store = window.playerStore;
  if (!videoEl || !store) return;

  const currentSegment = store.currentTrack as AdaptiveMediaSegment | undefined;
  if (!currentSegment) return;

  const targetQuality = quality ?? getTargetQuality();
  const targetSrc = getSegmentVideoSource(currentSegment, targetQuality);

  if (!targetSrc || videoEl.src === targetSrc) return;

  const currentTime = videoEl.currentTime;
  const isPlaying = !videoEl.paused;

  videoEl.src = targetSrc;
  videoEl.currentTime = currentTime;

  if (isPlaying) {
    videoEl
      .play()
      .catch((err) => console.error("Video quality switch error:", err));
  }
}

function attachMediaListeners(
  mediaEl: HTMLMediaElement,
  isAudio: boolean,
): void {
  mediaEl.addEventListener("play", () => {
    const currentModeIsAudio = window.playerStore?.isAudioMode ?? true;
    if (isAudio === currentModeIsAudio) {
      window.playerStore?.setPlaying(true);
    }
  });

  mediaEl.addEventListener("pause", () => {
    const currentModeIsAudio = window.playerStore?.isAudioMode ?? true;
    if (isAudio === currentModeIsAudio) {
      window.playerStore?.setPlaying(false);
    }
  });

  mediaEl.addEventListener("ended", () => {
    const currentModeIsAudio = window.playerStore?.isAudioMode ?? true;
    if (isAudio === currentModeIsAudio) {
      window.playerStore?.setPlaying(false);

      const store = window.playerStore;
      if (store) {
        const nextIdx = store.state.currentIndex + 1;
        if (nextIdx < store.state.segments.length) {
          store.selectSegment(nextIdx);
        }
      }
    }
  });

  mediaEl.addEventListener("timeupdate", () => {
    const currentModeIsAudio = window.playerStore?.isAudioMode ?? true;
    if (isAudio === currentModeIsAudio) {
      window.playerStore?.updateTime(mediaEl.currentTime, mediaEl.duration);
    }
  });
}

/**
 * Initializes listeners for Audio/Video players + dynamic viewport/fullscreen switches.
 */
export function initMediaController(): void {
  const audioEl = document.getElementById(
    "r2-audio-player",
  ) as HTMLAudioElement | null;
  const videoEl = document.getElementById(
    "r2-video-player",
  ) as HTMLVideoElement | null;

  if (audioEl) {
    attachMediaListeners(audioEl, true);
  }

  if (videoEl) {
    attachMediaListeners(videoEl, false);
  }

  // Handle Fullscreen toggle changes (Mobile landscape/fullscreen triggers 1080p)
  document.addEventListener("fullscreenchange", () => syncVideoSource());
  document.addEventListener("webkitfullscreenchange", () => syncVideoSource());

  // Handle dynamic window resizing across mobile threshold
  let resizeTimer: number;
  window.addEventListener("resize", () => {
    clearTimeout(resizeTimer);
    resizeTimer = window.setTimeout(() => syncVideoSource(), 200);
  });

  console.log(
    "🔊 [Media Controller] Audio, Video & Adaptive Quality (1080p/480p) attached.",
  );
}
