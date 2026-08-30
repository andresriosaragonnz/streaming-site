import { VideoPlayer } from "../../components/VideoPlayer";
import { AudioPlayer } from "../../components/AudioPlayer";
import { PlaylistPlayerControls } from "./PlaylistPlayerControls";
import { Menu } from "../../components/Menu";

export interface PlaylistViewPlayerProps {
  pageTitle: string;
  firstTitle: string;
  posterImage: string;
  firstMp3: string;
}

export const PlaylistViewPlayer = ({
  pageTitle,
  firstTitle,
  posterImage,
  firstMp3,
}: PlaylistViewPlayerProps) => (
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
        <div class="toggle" x-on:click="$store.player.togleMode()">
          <input type="checkbox" x-bind:checked="!$store.player.mode" />
          <label></label>
        </div>
      </div>
    </div>

    <div class="performance-title-big">{pageTitle}</div>
    <div
      class="performance-title break-hyphens"
      x-text={`$store.player.active?.formattedTitle || '${firstTitle}'`}
    >
      {firstTitle}
    </div>

    <div
      class="video-player-mock"
      style="width: 100%; aspect-ratio: 16 / 9; background-color: #000; position: relative; overflow: hidden; border-radius: 12px;"
    >
      <VideoPlayer posterImage={posterImage} />
      <AudioPlayer firstMp3={firstMp3} />
    </div>

    <PlaylistPlayerControls />
  </section>
);
