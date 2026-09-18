import { Menu } from "./Menu";

export interface TitleBarProps {
  /** Optional flag to render player controls on the right */
  player?: boolean;
}

export const AddToPlaylistDialog = () => (
  <dialog id="favorites-modal-dialog" class="commit-dialog">
    <div class="dialog-content">
      <header class="dialog-header">
        <h2>Add to Playlist</h2>
        <p
          class="dialog-subtitle"
          data-bind-text="player.currentSegment?.title || 'Selected Track'"
        >
          Selected Track
        </p>
      </header>

      <main class="dialog-body">
        <div
          class="meta-workspace-card"
          id="public-player-controls"
          style="padding: 8px 0; background: transparent; border: none;"
        >
          <div
            class="studio-controls-group"
            style="display: flex; flex-direction: column; gap: 12px; width: 100%;"
          >
            {/* Playlist Selector Dropdown & Toggle Group */}
            <div
              class="input-field-group playlist-select-group"
              style="display: flex; gap: 8px; align-items: flex-start; width: 100%;"
            >
              <div style="display: flex; flex-direction: column; width: 100%; gap: 8px;">
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
                  console.log({isHidden});
                  if (!isHidden) input.focus();
                "
              >
                <span>+</span>
              </button>
            </div>
          </div>
        </div>
      </main>

      <footer class="dialog-footer">
        <button
          type="button"
          class="btn-modal btn-modal-cancel"
          data-action="close-favorites-dialog"
        >
          Cancel
        </button>
        <button
          type="button"
          id="btn-add-to-playlist"
          class="btn-modal btn-modal-confirm"
          data-action="add-current-segment-to-playlist"
        >
          Add to playlist
        </button>
      </footer>
    </div>
  </dialog>
);

export const TitleBar = ({ player }: TitleBarProps) => (
  <div class="meta-title-card">
    <div class="meta-title-card-left">
      <Menu />
    </div>
    {player && (
      <div
        class="meta-title-card-right"
        style="display: flex; align-items: center; gap: 12px;"
      >
        {/* Favorites Trigger Button */}
        <button
          type="button"
          class="btn-icon-favorite"
          data-action="open-favorites-dialog"
          aria-label="Add to Favorites"
          title="Add to Favorites"
          style="background: transparent; border: none; cursor: pointer; color: currentColor; display: flex; align-items: center; justify-content: center; padding: 4px;"
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
          </svg>
        </button>

        {/* Audio/Video Mode Switcher */}
        <div
          class="toggle-container"
          style="display: flex; align-items: center;"
        >
          <div class="toggle">
            <input
              type="checkbox"
              id="player-mode-toggle"
              data-action="toggle-audio-mode"
              data-bind-checked="player.isAudioMode"
            />
            <label for="player-mode-toggle" aria-label="Toggle Audio Mode">
              {/* Video Mode Icon (Left) */}
              <svg
                class="toggle-icon toggle-icon-video"
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
                aria-hidden="true"
              >
                <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                <circle cx="12" cy="13" r="4" />
              </svg>

              {/* Audio Mode Icon (Right) */}
              <svg
                class="toggle-icon toggle-icon-audio"
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
                aria-hidden="true"
              >
                <path d="M9 18V5l12-2v13" />
                <circle cx="6" cy="18" r="3" />
                <circle cx="18" cy="16" r="3" />
              </svg>
            </label>
          </div>
        </div>

        {/* Favorites & Playlist Management Modal Dialog */}
        <AddToPlaylistDialog />
      </div>
    )}
  </div>
);
