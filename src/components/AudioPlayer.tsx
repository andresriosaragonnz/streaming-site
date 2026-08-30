export interface AudioPlayerProps {
  firstMp3: string;
}

export function AudioPlayer({ firstMp3 }: AudioPlayerProps) {
  return (
    <div
      x-cloak
      x-show="$store.player.mode === false"
      class="audio-player"
      style="width: 100%; height: 100%; display: none"
    >
      <div class="audio-player" style="width: 100%; height: 100%">
        <img
          src="https://pub-fef6bcaae286450e98785a845f724ff1.r2.dev/images/cassete_icon.jpg"
          alt="Audio Player Cover"
          class="audio-player-hero"
        />

        <div class="audio-player-controls">
          <audio
            id="r2-audio-player"
            controls=""
            style="width: 100%"
            src={firstMp3}
            x-bind:src={`$store.player.active?.sourceMp3 || '${firstMp3}'`}
          ></audio>
        </div>
      </div>
    </div>
  );
}
