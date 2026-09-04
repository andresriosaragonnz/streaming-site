export const AudioToggle = () => (
  <div class="toggle">
    <button
      type="button"
      role="switch"
      id="player-mode-toggle"
      data-action="toggle-audio-mode"
      data-bind-aria-checked="player.isAudioMode"
      data-bind-class="player.isAudioMode ? 'is-active' : ''"
      aria-label="Toggle Audio Mode"
      aria-checked="false"
      class=""
    >
      <span class="toggle-slider"></span>
    </button>
  </div>
);
