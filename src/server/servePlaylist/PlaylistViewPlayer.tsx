import { VideoPlayer } from "../../components/VideoPlayer";
import { AudioToggle } from "../../components/AudioToggle";
import { AudioPlayer } from "../../components/AudioPlayer";
import { PlaylistPlayerControls } from "./PlaylistPlayerControls";
import { TitleBar } from "../../components/TitleBar";

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
    <TitleBar player />
    <div class="performance-title-big">{pageTitle}</div>
    <div
      class="performance-title break-hyphens"
      data-bind-text="player.currentTrack ? player.currentTrack.title : ''"
    >
      {firstTitle}
    </div>

    <div
      class="video-player-mock"
      data-bind-class-toggle="is-audio-mode:player.isAudioMode"
    >
      {/* Video View Context */}
      <VideoPlayer posterImage={posterImage} />

      {/* Audio View Context */}
      <AudioPlayer firstMp3={firstMp3} />
    </div>

    <PlaylistPlayerControls />
  </section>
);
