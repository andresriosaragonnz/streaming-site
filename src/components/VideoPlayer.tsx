export interface VideoPlayerProps {
  posterImage?: string;
  firstVideo?: string;
}

export const VideoPlayer = ({
  posterImage = "",
  firstVideo = "",
}: VideoPlayerProps) => {
  return (
    <div
      class="video-player-container relative w-full h-full"
      data-action="player-wrapper"
      data-bind-class="player.isAudioMode ? 'video-player-container is-hidden' : 'video-player-container'"
    >
      <video
        id="r2-video-player"
        controls
        playsinline
        preload="none"
        poster={posterImage ? `${posterImage}.jpg` : ""}
        data-action="video-element"
        data-bind-src="player.currentTrack ? (window.matchMedia('(min-width: 769px)').matches ? (player.currentTrack.sourceVideo1080p || player.currentTrack.source) : (player.currentTrack.sourceVideo480p || player.currentTrack.source)) : ''"
        style="width: 100%; height: 100%; object-fit: cover; display: block;"
      />

      <button
        type="button"
        class="video-play-overlay"
        aria-label="Play Video"
        data-action="toggle-media-play"
        data-bind-class="player.isPlaying || player.isAudioMode ? 'video-play-overlay is-hidden' : 'video-play-overlay'"
        style="position: absolute; inset: 0; width: 100%; height: 100%; background: rgba(0, 0, 0, 0.35); border: none; cursor: pointer; display: flex; align-items: center; justify-content: center; z-index: 5; transition: opacity 0.2s ease;"
      >
        <span
          class="play-icon-wrapper"
          style="width: 64px; height: 64px; border-radius: 50%; background: rgba(24, 24, 27, 0.55); border: 1px solid #ffffff; display: flex; align-items: center; justify-content: center; backdrop-filter: blur(4px);"
        >
          <svg
            width="28"
            height="28"
            viewBox="0 0 24 24"
            fill="#ffffff"
            stroke="#ffffff"
            stroke-width="1.5"
            stroke-linecap="round"
            stroke-linejoin="round"
            style="margin-left: 3px;"
          >
            <polygon points="5 3 19 12 5 21 5 3" />
          </svg>
        </span>
      </button>
    </div>
  );
};
