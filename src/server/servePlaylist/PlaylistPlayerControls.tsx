export interface PlaylistPlayerControlsProps {}

export const PlaylistPlayerControls = () => (
  <div
    class="meta-workspace-card"
    x-data="{ selectedPlaylist: Object.keys($store.playlists.playlists)[0] || 'favorites' }"
  >
    <div class="header-row">
      <div class="studio-controls-group">
        <button
          x-on:click="$store.playlists.generateShareLink(selectedPlaylist)"
          type="button"
          class="btn-public"
        >
          <span>Share playlist</span>
        </button>
      </div>
    </div>
  </div>
);
