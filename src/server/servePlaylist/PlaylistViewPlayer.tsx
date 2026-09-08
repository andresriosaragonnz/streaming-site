import { VideoPlayer } from "../../components/VideoPlayer";
import { AudioPlayer } from "../../components/AudioPlayer";
import { AddToPlaylist } from "../../components/AddToPlaylist";
import { TitleBar } from "../../components/TitleBar";
import { ShareIcon } from "../../components/ShareIcon";

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
    <div style="display:flex;flex-direction:row;gap:8px">
      <div
        class="performance-title break-hyphens"
        data-bind-text="player.currentTrack ? player.currentTrack.title : ''"
      >
        {firstTitle}
      </div>
      <button
        type="button"
        class="share-btn"
        style="background: none; border: none; padding: 0; cursor: pointer; color: inherit;"
        data-action="copy-share-url"
      >
        <span>
          <ShareIcon />
        </span>
      </button>
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
    <AddToPlaylist />
  </section>
);
