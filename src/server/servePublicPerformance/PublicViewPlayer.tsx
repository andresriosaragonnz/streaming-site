import { TitleBar } from "../../components/TitleBar";
import { VideoPlayer } from "../../components/VideoPlayer";
import { AudioPlayer } from "../../components/AudioPlayer";
import { ConstellationBtn } from "../../components/ConstellationBtn";
import { AddToPlaylist } from "../../components/AddToPlaylist";
import { LockIcon } from "./LockIcon";

export interface PublicViewPlayerProps {
  studioTitle: string;
  firstTitle: string;
  posterImage: string;
  firstMp3: string;
  artistLink: string;
  artistName: string;
  isAllowed?: boolean;
  performanceLink: string;
}

export const PublicViewPlayer = ({
  studioTitle,
  firstTitle,
  posterImage,
  firstMp3,
  artistLink,
  isAllowed,
  artistName,
  performanceLink,
}: PublicViewPlayerProps) => (
  <section class="player-column" id="publicPlayerColumn">
    {/* Navigation & Mode Toggle Header */}
    <TitleBar player />

    {/* Metadata Information Section */}
    <header class="player-metadata">
      <div class="artist-title">
        <div class="u-flex u-gap-md">
          <a
            class="sidebar-artist-button"
            href={`/${artistLink}`}
            id="artist-name"
            data-artist={artistLink}
          >
            {artistName}
          </a>
          {isAllowed && (
            <a class="" href={`/private/performance/${performanceLink}`}>
              <span class="download-button download-button--stacked">
                <LockIcon />
                <span class="download-button__label">Private</span>
              </span>
            </a>
          )}
        </div>
        <button
          id="reset-btn"
          class="search-trigger"
          type="button"
          title="Show Network"
          aria-label="Show Network"
          data-action="open-graph-modal"
        >
          <ConstellationBtn />
        </button>
      </div>
      <h2 class="performance-heading break-hyphens">{studioTitle}</h2>

      <h3
        class="performance-subtitle break-hyphens"
        data-bind-text="player.currentTitle"
      >
        {firstTitle}
      </h3>
    </header>

    {/* Player Canvas Wrapper (Updated to data-bind-class for UI.ts compatibility) */}
    <div
      class="video-player-mock"
      data-bind-class="player.isAudioMode ? 'video-player-mock is-audio-mode' : 'video-player-mock'"
    >
      {/* Video View Context */}
      <VideoPlayer posterImage={posterImage} />

      {/* Audio View Context */}
      <AudioPlayer firstMp3={firstMp3} />
    </div>
  </section>
);
