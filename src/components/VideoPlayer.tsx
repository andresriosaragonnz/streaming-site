// src/components/VideoPlayer.tsx
export interface VideoPlayerProps {
  posterImage: string;
}

export function VideoPlayer({ posterImage }: VideoPlayerProps) {
  return (
    <div
      id="video-player-container"
      data-bind-show="!player.isAudioMode"
      style="width: 100%; height: 100%; position: relative;"
    >
      <div style="width: 100%; height: 100%; position: relative">
        <video
          id="r2-stream-player"
          controls
          playsinline
          preload="none"
          poster={`${posterImage}.jpg`}
          data-bind-poster="player.currentPoster"
          style="width: 100%; height: 100%; object-fit: contain; display: block; background: #000;"
        ></video>

        {/* Centered Play Overlay */}
        <div
          id="video-play-overlay"
          onclick="this.style.display='none'; window.playerStore.playCurrent();"
          style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; display: grid; place-items: center; background: rgba(0, 0, 0, 0.35); cursor: pointer; z-index: 10; touch-action: manipulation;"
        ></div>
      </div>
    </div>
  );
}
