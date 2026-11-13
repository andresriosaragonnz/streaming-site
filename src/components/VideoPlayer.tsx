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
      class="video-player-container"
      data-action="player-wrapper"
      data-bind-class="player.isAudioMode ? 'video-player-container is-hidden' : 'video-player-container'"
    >
      <video
        class="u-cover"
        id="r2-video-player"
        controls
        playsinline
        preload="none"
        poster={posterImage || ""}
        data-action="video-element"

      />

      <button
        type="button"
        class="video-play-overlay"
        aria-label="Play Video"
        data-action="toggle-media-play"
        data-bind-class="player.isPlaying || player.isAudioMode ? 'video-play-overlay is-hidden' : 'video-play-overlay'"
      >
        <span
          class="play-icon-wrapper"
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
          >
            <polygon points="5 3 19 12 5 21 5 3" />
          </svg>
        </span>
      </button>
    </div>
  );
};
