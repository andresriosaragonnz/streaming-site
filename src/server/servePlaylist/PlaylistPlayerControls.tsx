import { AddToPlaylist } from "../../components/AddToPlaylist";
export interface PlaylistPlayerControlsProps {}

export const PlaylistPlayerControls = () => (
  <>
    <div class="meta-workspace-card" id="playlist-player-controls">
      <div class="header-row">
        <div class="studio-controls-group">
          <button type="button" class="btn-public" data-action="copy-share-url">
            <span>Share playlist</span>
          </button>
        </div>
      </div>
    </div>
    <AddToPlaylist />
  </>
);
