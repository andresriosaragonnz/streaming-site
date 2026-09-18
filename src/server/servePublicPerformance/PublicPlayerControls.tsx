export interface PublicPlayerControlsProps {}

export const PublicPlayerControls = () => (
  <div class="meta-workspace-card" id="public-player-controls">
    <div class="studio-controls-group">
      {/* Playlist Selector Dropdown */}
      <div class="input-field-group playlist-select-group">
        <select
          id="playlist-select"
          class="select-public"
          data-action="playlist-select-change"
        >
          <option value="Favorites" selected>
            Favorites
          </option>
          <option value="+ New Playlist...">+ New Playlist...</option>
        </select>
      </div>

      {/* Dynamic Custom Playlist Name Input */}
      <div
        id="custom-playlist-group"
        class="input-field-group custom-playlist-group"
        data-bind-show="Boolean(player.isCustomPlaylistInput)"
      >
        <input
          type="text"
          id="custom-playlist-name"
          placeholder="Enter playlist name..."
          class="input-public"
        />
      </div>

      {/* Save Segment Action Button */}
      <button
        type="button"
        class="btn-public btn-save-segment"
        data-action="add-current-segment-to-playlist"
      >
        <span>Add to playlist</span>
      </button>
    </div>
  </div>
);
