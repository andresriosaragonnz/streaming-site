import { CommitModal } from "./CommitModal";

export interface PrivatePlayerControlsProps {
  segments: any[];
}

export const PrivatePlayerControls = ({
  segments,
}: PrivatePlayerControlsProps) => (
  <>
    <div class="meta-workspace-card">
      <div class="studio-controls-group">
        <div class="input-field-group">
          <input
            type="text"
            data-action="sync-track-title"
            data-bind-value="review.active?.title || ''"
          />
        </div>

        <button
          type="button"
          class="btn-status"
          data-action="toggle-track-status"
          data-bind-class="review.isCurrentPublic ? 'btn-public-green' : 'btn-private-red'"
        >
          <span data-bind-text="review.isCurrentPublic ? 'Public' : 'Private'">
            Public
          </span>
        </button>

        <div class="studio-controls-status-count-container">
          <span
            class="studio-controls-status-count"
            data-bind-text="`public:${review.publicCount}`"
          >
            public:0
          </span>
          <span
            class="studio-controls-status-count"
            data-bind-text="`private:${review.privateCount}`"
          >
            private:0
          </span>
        </div>

        <div class="status-action-wrapper">
          <button
            type="button"
            class="btn-status btn-public-green"
            data-action="open-modal"
            data-modal-id="commit-modal-container"
            data-bind-show="review.hasUncommittedChanges"
          >
            <span>Commit</span>
          </button>
        </div>
      </div>
    </div>

    {/* Placed at root level to leverage position: fixed .modal-backdrop */}
    <CommitModal segments={segments} />
  </>
);
