import { TitleBar } from "../../../components/TitleBar";
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
    {/* Navigation & Mode Toggle Header */}
    <TitleBar player />
    {/* Metadata Information Section */}
    <header class="player-metadata">
      <span class="performance-title-big">Performance</span>
      <h2 class="performance-title break-hyphens">{studioTitle}</h2>
      <h3
        class="performance-subtitle break-hyphens"
        data-bind-text="player.currentTitle"
      >
        {firstTitle}
      </h3>
    </header>
    {/* Player Canvas Wrapper (Controlled via player.isAudioMode class) */}
    <div
      class="video-player-mock"
      data-bind-class-toggle="is-audio-mode:player.isAudioMode"
    >
      {/* Video View Context */}
      <VideoPlayer posterImage={posterImage} />

      {/* Audio View Context */}
      <AudioPlayer firstMp3={firstMp3} />
    </div>
    {/* Control Action Bar */}
    <PublicPlayerControls />
  </section>
);
