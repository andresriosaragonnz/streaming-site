import { Menu } from "./Menu";
import { LockIcon } from "../server/servePublicPerformance/LockIcon";

export interface TitleBarProps {
  /** Optional flag to render player controls on the right */
  player?: boolean;
  isAllowed?: boolean;
  performanceLink?: string;
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
          class="meta-workspace-card dialog-workspace"
          id="public-player-controls"
        >
          <div class="studio-controls-group dialog-controls-group">
            {/* Playlist Selector Dropdown & Toggle Group */}
            <div class="playlist-select-group dialog-playlist-group">
              <div class="u-flex u-col u-full u-gap-sm">
                <select id="playlist-select" class="select-public">
                  {/* Dynamically populated client-side by PlayerStore */}
                </select>

                {/* Custom Playlist Name Input (Hidden by default) */}
                <div
                  id="custom-playlist-group"
                  class="custom-playlist-group is-hidden"
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
                class="btn btn-public btn-icon-only"
                title="Create new playlist"
                data-action="toggle-custom-playlist"
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
          class="btn btn-modal btn-modal-cancel"
          data-action="close-favorites-dialog"
        >
          Cancel
        </button>
        <button
          type="button"
          id="btn-add-to-playlist"
          class="btn btn-modal btn-modal-confirm btn-add-to-playlist"
          data-action="add-current-segment-to-playlist"
        >
          Add to playlist
        </button>
      </footer>
    </div>
  </dialog>
);

export const TitleBar = ({
  player,
  isAllowed,
  performanceLink,
}: TitleBarProps) => (
  <div class="meta-title-card">
    <div class="meta-title-card-left">
      <Menu />
    </div>
    {isAllowed && (
      <a
        class="performance-heading-icon"
        href={`/private/performance/${performanceLink}`}
      >
        <span class="download-button ">
          <LockIcon />
        </span>
      </a>
    )}
    {player && (
      <div class="meta-title-card-right u-flex u-center u-gap-md">
        {/* Favorites Trigger Button */}
        <button
          type="button"
          class="btn btn-icon-favorite"
          data-action="open-favorites-dialog"
          aria-label="Add to Favorites"
          title="Add to Favorites"
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
        <div class="toggle-container u-flex u-center">
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
