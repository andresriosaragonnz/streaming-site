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
        {/* Editable Title Input for Active Segment */}
        <input
          type="text"
          class="input-public"
          data-action="sync-segment-title"
          data-bind-value="review.activeTrack?.title || ''"
          placeholder="Segment Title..."
        />

        {/* Current Segment Public/Private Toggle */}
        <button
          type="button"
          class="btn-status"
          data-action="toggle-segment-status"
          data-bind-class="{ 'btn-public-green': review.isCurrentPublic, 'btn-private-red': !review.isCurrentPublic }"
        >
          <span data-bind-text="review.isCurrentPublic ? 'Public' : 'Private'">
            Public
          </span>
        </button>

        {/* Status Counter Displays */}
        <div class="studio-controls-status-count-container">
          <h3 data-bind-text="`public:${review.publicCount}`">public:0</h3>
          <h3 data-bind-text="`private:${review.privateCount}`">private:0</h3>
        </div>

        {/* Commit Button (Class-toggled to stay hidden until uncommitted changes exist) */}

        <button
          data-bind-class="{ 'is-hidden': !review.hasUncommittedChanges }"
          type="button"
          class="btn-status btn-public-green"
          data-action="open-commit-dialog"
        >
          <span>Commit</span>
        </button>
      </div>
    </div>

    {/* Native HTML Dialog Modal */}
    <CommitModal segments={segments} />
  </>
);
