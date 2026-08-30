import { Menu } from "../../components/Menu";
import { VideoPlayer } from "../../components/VideoPlayer";
import { PrivatePlayerControls } from "./PrivatePlayerControls";

export interface PrivateViewPlayerProps {
  studioTitle: string;
  posterImage: string;
}

export const PrivateViewPlayer = ({
  studioTitle,
  posterImage,
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
        x-show="active.source"
        style="width: 100%; height: 100%; background: #000"
      >
        <VideoPlayer posterImage={posterImage} />
      </div>
    </div>

    <PrivatePlayerControls />
  </section>
);
