export interface AudioPlayerProps {
  firstMp3: string;
}

export function AudioPlayer({ firstMp3 }: AudioPlayerProps) {
  const cassetteCover =
    "https://pub-fef6bcaae286450e98785a845f724ff1.r2.dev/images/cassete_icon.jpg";

  return (
    <div
      class="audio-player-container"
      data-bind-class="player.isAudioMode ? 'audio-player-container' : 'audio-player-container is-hidden'"
      style="width: 100%; height: 100%; position: absolute; inset: 0; overflow: hidden; background-color: #000;"
    >
      <div
        class="audio-player"
        style="width: 100%; height: 100%; cursor: pointer; position: relative;"
      >
        {/* Layer 1: Track Card Image Background */}
        <img
          src=""
          alt="Track Background"
          class="audio-player-bg"
          data-bind-src="player.currentTrack ? player.currentTrack.cardImage : ''"
          style="width: 100%; height: 100%; object-fit: cover; opacity: 0.45; filter: blur(2px); position: absolute; inset: 0;"
        />

        {/* Layer 2: Cassette Graphic Overlay (Interactive Click Target) */}
        <img
          src={cassetteCover}
          alt="Cassette Player Deck"
          class="audio-player-hero"
          data-action="toggle-media-play"
          style="width: 100%; height: 100%; object-fit: contain; position: absolute; inset: 0; z-index: 1; mix-blend-mode: screen; pointer-events: auto;"
        />

        {/* Layer 3: Controls Bar Overlay (Stopped from bubbling) */}
        <div
          class="audio-player-controls"
          onclick="event.stopPropagation()"
          style="position: absolute; bottom: 0; left: 0; right: 0; z-index: 3;"
        >
          <audio
            id="r2-audio-player"
            controls
            preload="metadata"
            style="width: 100%; display: block;"
            src={firstMp3}
            data-bind-src="player.currentTrack ? player.currentTrack.sourceMp3 : ''"
          />
        </div>
      </div>
    </div>
  );
}
