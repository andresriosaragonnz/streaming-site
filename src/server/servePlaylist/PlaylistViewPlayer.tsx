import { VideoPlayer } from "../../components/VideoPlayer";
import { AudioToggle } from "../../components/AudioToggle";
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
  <section class="player-column" id="publicPlayerColumn">
    <div class="meta-title-card">
      <div>
        <Menu />
      </div>
      <div class="meta-title-card-right">
        <AudioToggle />
      </div>
    </div>

    <div class="performance-title-big">{pageTitle}</div>
    <div
      class="performance-title break-hyphens"
      data-bind-text="player.currentTitle"
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
