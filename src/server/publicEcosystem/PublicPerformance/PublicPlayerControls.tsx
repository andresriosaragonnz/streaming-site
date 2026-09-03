export interface PublicPlayerControlsProps {}

export const PublicPlayerControls = () => (
  <div class="meta-workspace-card" id="public-player-controls">
    <div
      class="studio-controls-group"
      style="display: flex; align-items: center; gap: 8px; min-height: 40px"
    >
      {/* Playlist Selector */}
      <div class="input-field-group" style="min-width: 160px">
        <select
          id="playlist-select"
          style="width: 100%"
          onchange="window.playlistUtils?.handlePlaylistSelectChange(this)"
        >
          <option value="favorites" selected>
            favorites
          </option>
          <option value="+ New Playlist...">+ New Playlist...</option>
        </select>
      </div>

      {/* Free Text Input */}
      <div
        id="custom-playlist-group"
        class="input-field-group"
        style="display: none; min-width: 180px"
      >
        <input
          type="text"
          id="custom-playlist-name"
          placeholder="Enter playlist name..."
          class="input-public"
          style="width: 100%"
        />
      </div>

      {/* Add Button */}
      <button
        type="button"
        class="btn-public"
        style="white-space: nowrap"
        onclick="window.playlistUtils?.handleAddToPlaylistSubmit(event)"
      >
        <span>Add to playlist</span>
      </button>
    </div>
  </div>
);
