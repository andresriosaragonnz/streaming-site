import { Menu } from "../../components/Menu";
import { VideoPlayer } from "../../components/VideoPlayer";
import { PrivatePlayerControls } from "./PrivatePlayerControls";

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
    <a
      class="performance-title"
      href={`/download/${artistName}-${performance}`}
      target="_blank"
    >
      Download full video {masterSize} Gb
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
