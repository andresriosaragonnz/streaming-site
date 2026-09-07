import { Menu } from "./Menu";

export interface TitleBarProps {
  /** Optional flag to render player controls on the right */
  player?: boolean;
}

export const TitleBar = ({ player }: TitleBarProps) => (
  <div class="meta-title-card">
    <div class="meta-title-card-left">
      <Menu />
    </div>
    {player && (
      <div class="meta-title-card-right">
        {/* Audio/Video Mode Switcher */}
        <div class="toggle">
          <input
            type="checkbox"
            id="player-mode-toggle"
            data-action="toggle-audio-mode"
            data-bind-checked="player.isAudioMode"
          />
          <label
            for="player-mode-toggle"
            aria-label="Toggle Audio Mode"
          ></label>
        </div>
      </div>
    )}
  </div>
);
