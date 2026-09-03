import { Menu } from "../../../components/Menu";
import { VideoPlayer } from "../../../components/VideoPlayer";
import { AudioPlayer } from "../../../components/AudioPlayer";
import { PublicPlayerControls } from "./PublicPlayerControls";

export interface PublicViewPlayerProps {
  studioTitle: string;
  firstTitle: string;
  posterImage: string;
  firstMp3: string;
}

export const PublicViewPlayer = ({
  studioTitle,
  firstTitle,
  posterImage,
  firstMp3,
}: PublicViewPlayerProps) => (
  <section class="player-column" id="publicPlayerColumn">
    <div class="meta-title-card">
      <div>
        <Menu />
      </div>
      <div class="meta-title-card-right">
        {/* Toggle Mode */}
        <div class="toggle">
          <input
            type="checkbox"
            id="player-mode-toggle"
            data-action="toggle-audio-mode"
            data-bind-checked="player.isAudioMode"
          />
          <label for="player-mode-toggle"></label>
        </div>
      </div>
    </div>

    <div class="performance-title-big">Performance</div>
    <div class="performance-title break-hyphens">{studioTitle}</div>
    <div
      class="performance-title break-hyphens"
      data-bind-text="player.currentTitle"
    >
      {firstTitle}
    </div>

    {/* Outer wrapper with locked 16:9 ratio */}
    <div
      class="video-player-mock"
      style="
        width: 100%;
        aspect-ratio: 16 / 9;
        background-color: #000;
        position: relative;
        overflow: hidden;
        border-radius: 12px;
      "
    >
      {/* VIDEO VIEW */}
      <VideoPlayer posterImage={posterImage} />

      {/* AUDIO VIEW */}
      <AudioPlayer firstMp3={firstMp3} />
    </div>

    <PublicPlayerControls />
  </section>
);
