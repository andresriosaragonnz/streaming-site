export const AddToPlaylist = () => (
  <div class="meta-workspace-card" id="public-player-controls">
    <div class="studio-controls-group">
      {/* Playlist Selector Dropdown */}
      <div class="input-field-group playlist-select-group">
        <div style="display:flex;flex-direction:column;width:70%">
          <select id="playlist-select" class="select-public">
            {/* Dynamically populated client-side by PlayerStore */}
          </select>
          {/* Custom Playlist Name Input (Hidden by default) */}
          <div
            id="custom-playlist-group"
            class="input-field-group custom-playlist-group hidden"
          >
            <input
              type="text"
              id="custom-playlist-name"
              placeholder="New playlist name..."
              class="input-public"
              onkeydown="
            if (event.key === 'Enter') {
              event.preventDefault();
              document.getElementById('btn-add-to-playlist')?.click();
            }
          "
            />
          </div>
        </div>
        {/* Toggle Button to reveal custom name input */}
        <button
          type="button"
          id="btn-toggle-new-playlist"
          class="btn-public btn-icon-only"
          title="Create new playlist"
          onclick="
    const inputGroup = document.getElementById('custom-playlist-group');
    const input = document.getElementById('custom-playlist-name');
    const isHidden = inputGroup.classList.toggle('hidden');
    console.log({isHidden})
    if (!isHidden) input.focus();
  "
        >
          <span>+</span>
        </button>
      </div>

      {/* Save Action Button (triggers binder action via click) */}
      <button
        type="button"
        id="btn-add-to-playlist"
        class="btn-public btn-save-segment"
        data-action="add-current-segment-to-playlist"
      >
        <span>Add to playlist</span>
      </button>
    </div>
  </div>
);
