export interface PublicPlayerControlsProps {}

export const PublicPlayerControls = () => (
  <div
    class="meta-workspace-card"
    x-data="{ selectedPlaylist: 'favorites', customPlaylistName: '' }"
  >
    <div
      class="studio-controls-group"
      style="display: flex; align-items: center; gap: 8px; min-height: 40px"
    >
      {/* Playlist Selector */}
      <div class="input-field-group" style="min-width: 160px">
        <select x-model="selectedPlaylist" style="width: 100%">
          <option value="favorites">favorites</option>
          <template
            x-for="name in $store.playlists.getPlaylistOptions()"
            x-bind:key="name"
          >
            <template x-if="name !== 'favorites'">
              <option x-bind:value="name" x-text="name"></option>
            </template>
          </template>
        </select>
      </div>

      {/* Free Text Input */}
      <div
        class="input-field-group"
        x-show="selectedPlaylist === '+ New Playlist...'"
        x-cloak
        style="display: none; min-width: 180px"
      >
        <input
          type="text"
          x-model="customPlaylistName"
          placeholder="Enter playlist name..."
          class="input-public"
          style="width: 100%"
        />
      </div>

      {/* Add Button */}
      <button
        {...{
          "x-on:click": `
            const target = selectedPlaylist === '+ New Playlist...' ? customPlaylistName.trim() : selectedPlaylist;
            if (target) {
              $store.playlists.addActiveToPlaylist(target);
              if (selectedPlaylist === '+ New Playlist...') {
                selectedPlaylist = target;
                customPlaylistName = '';
              }
            } else {
              $store.toast.trigger('Please enter a valid playlist name.', 'error');
            }
          `,
        }}
        type="button"
        class="btn-public"
        style="white-space: nowrap"
      >
        <span>Add to playlist</span>
      </button>
    </div>
  </div>
);
