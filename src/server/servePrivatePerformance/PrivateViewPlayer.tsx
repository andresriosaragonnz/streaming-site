import { Menu } from "../../components/Menu";
import { VideoPlayer } from "../../components/VideoPlayer";
import { PrivatePlayerControls } from "./PrivatePlayerControls";
import { DownloadIcon } from "./DownloadIcon";
import { DashboardIcon } from "./DashboardIcon";
import { GlobeIcon } from "./GlobeIcon";

export interface PrivateViewPlayerProps {
  studioTitle: string;
  posterImage: string;
  segments: any;
  artistName: string;
  performance: string;
  masterSize: string;
}

export const PrivateViewPlayer = ({
  studioTitle,
  posterImage,
  segments,
  artistName,
  performance,
  masterSize,
}: PrivateViewPlayerProps) => (
  <section class="player-column">
    <div class="meta-title-card">
      <Menu />
    </div>
    <div class="performance-heading">{studioTitle}</div>
    <div class="private-player-button-container">
      <a class="" href={`/${artistName}/${performance}?t=${Date.now()}`}>
        <span class="download-button download-button--stacked">
          <GlobeIcon />
          <span class="download-button__label">Public view</span>
        </span>
      </a>
      <a class="" href={`/private/${artistName}`}>
        <span class="download-button download-button--stacked">
          <DashboardIcon />
          <span class="download-button__label">Dashboard</span>
        </span>
      </a>
      <a class="" href={`/download/${artistName}-${performance}`}>
        <span class="download-button download-button--stacked">
          <DownloadIcon />
          <span class="download-button__label">{masterSize} Gb</span>
        </span>
      </a>
    </div>

    <div class="video-player-mock">
      <div
        class="video-container"
        data-bind-show="Boolean(review.active.source)"
      >
        <VideoPlayer posterImage={posterImage} />
      </div>
    </div>
    <PrivatePlayerControls segments={segments} />
  </section>
);
