import { Menu } from "../../components/Menu";
import { VideoPlayer } from "../../components/VideoPlayer";
import { PrivatePlayerControls } from "./PrivatePlayerControls";
import { DownloadIcon } from "./DownloadIcon";

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
      <div>
        <Menu />
      </div>
      <div class="meta-title-card-right"></div>
    </div>
    <div class="performance-title">Private performance</div>
    <a class="performance-title" href={`/private/${artistName}`}>
      Back to dashboard
    </a>
    <div class="performance-title">{studioTitle}</div>
    <a
      class="performance-title"
      href={`/${artistName}/${performance}?t=${Date.now()}`}
    >
      Public Version
    </a>
    {/* Layout A: download icon stacked on top of the label */}
    <a
      class="performance-title"
      href={`/download/${artistName}-${performance}`}
      target="_blank"
    >
      <span class="download-button download-button--stacked">
        <DownloadIcon />
        <span class="download-button__label">
          Download full video {masterSize} Gb
        </span>
      </span>
    </a>

    {/* Layout B: download icon with the size label inline */}
    <a
      class="performance-title"
      href={`/download/${artistName}-${performance}`}
      target="_blank"
    >
      <span class="download-button download-button--inline">
        <DownloadIcon />
        <span class="download-button__label">{masterSize} Gb</span>
      </span>
    </a>
    <div class="video-player-mock">
      <div
        class="video-container"
        data-bind-style-display="review.active.source ? 'block' : 'none'"
        style="width: 100%; height: 100%; background: #000; display: block;"
      >
        <VideoPlayer posterImage={posterImage} />
      </div>
    </div>

    <PrivatePlayerControls segments={segments} />
  </section>
);
