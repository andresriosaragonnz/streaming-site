export interface AudioPlayerProps {
  firstMp3: string;
}

export function AudioPlayer({ firstMp3 }: AudioPlayerProps) {
  return (
    <div
      class="audio-player-container"
      data-bind-show="player.isAudioMode"
      style="width: 100%; height: 100%; display: none;"
    >
      <div
        class="audio-player"
        data-action="toggle-audio-play"
        style="width: 100%; height: 100%; cursor: pointer; position: relative;"
      >
        <img
          src="https://pub-fef6bcaae286450e98785a845f724ff1.r2.dev/images/cassete_icon.jpg"
          alt="Audio Player Cover"
          class="audio-player-hero"
        />

        <div
          class="audio-player-controls"
          onclick="event.stopPropagation();"
          style="position: relative; z-index: 2;"
        >
          <audio
            id="r2-audio-player"
            controls
            preload="metadata"
            style="width: 100%;"
            src={firstMp3}
            data-bind-src="player.active.sourceMp3"
          ></audio>
        </div>
      </div>
    </div>
  );
}
