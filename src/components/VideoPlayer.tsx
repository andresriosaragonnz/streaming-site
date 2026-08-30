export interface VideoPlayerProps {
  posterImage: string;
}

export function VideoPlayer({ posterImage }: VideoPlayerProps) {
  return (
    <div
      x-bind:style="$store.player.mode === false ? 'display: none !important;' : 'display: block; width: 100%; height: 100%; position: relative;'"
      style="width: 100%; height: 100%; position: relative; display: block"
    >
      <div
        x-data="{ isInitialized: false }"
        x-effect="
          $store.player.currentIndex;
          isInitialized = false;
        "
        style="width: 100%; height: 100%; position: relative"
      >
        <video
          id="r2-stream-player"
          controls
          playsinline
          preload="none"
          poster={`${posterImage}.jpg`}
          x-bind:poster={`$store.player.active?.cardImage ? \`\${$store.player.active.cardImage}.jpg\` : '${posterImage}.jpg'`}
          style="width: 100%; height: 100%; object-fit: contain; display: block; background: #000;"
        ></video>

        {/* Centered Play Overlay */}
        <div
          x-show="!isInitialized"
          x-on:click="$event.preventDefault(); $event.stopPropagation(); isInitialized = true; $store.player.playCurrent();"
          style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; display: grid; place-items: center; background: rgba(0, 0, 0, 0.35); cursor: pointer; z-index: 10; touch-action: manipulation;"
        ></div>
      </div>
    </div>
  );
}
