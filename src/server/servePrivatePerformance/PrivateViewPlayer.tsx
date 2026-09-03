import { Menu } from "../../components/Menu";
import { VideoPlayer } from "../../components/VideoPlayer";
import { PrivatePlayerControls } from "./PrivatePlayerControls";

export interface PrivateViewPlayerProps {
  studioTitle: string;
  posterImage: string;
  segments: any;
}

export const PrivateViewPlayer = ({
  studioTitle,
  posterImage,
  segments,
}: PrivateViewPlayerProps) => (
  <section class="player-column">
    <div class="meta-title-card">
      <div>
        <Menu />
      </div>
      <div class="meta-title-card-right"></div>
    </div>
    <div class="performance-title">{studioTitle}</div>

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
