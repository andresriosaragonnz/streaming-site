export interface PlaylistPlayerControlsProps {}

export const PlaylistPlayerControls = () => (
  <div class="meta-workspace-card" id="playlist-player-controls">
    <div class="header-row">
      <div class="studio-controls-group">
        <button
          type="button"
          class="btn-public"
          onclick="window.playlistStore?.shareCurrentPlaylist()"
        >
          <span>Share playlist</span>
        </button>
      </div>
    </div>
  </div>
);
