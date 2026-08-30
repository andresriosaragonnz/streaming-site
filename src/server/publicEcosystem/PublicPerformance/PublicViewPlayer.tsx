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
  <section
    class="player-column"
    x-data="publicWorkspace"
    id="publicPlayerColumn"
  >
    <div class="meta-title-card">
      <div>
        <Menu />
      </div>
      <div class="meta-title-card-right">
        {/* Toggle Mode */}
        <div class="toggle" x-on:click="$store.player.togleMode()">
          <input type="checkbox" x-bind:checked="!$store.player.mode" />
          <label></label>
        </div>
      </div>
    </div>

    <div class="performance-title-big">Performance</div>
    <div class="performance-title break-hyphens">{studioTitle}</div>
    <div
      class="performance-title break-hyphens"
      x-text={`$store.player.active?.formattedTitle || '${firstTitle}'`}
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
