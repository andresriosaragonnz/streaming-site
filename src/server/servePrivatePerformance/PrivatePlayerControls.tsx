import { CommitModal } from "./CommitModal";

export interface PrivatePlayerControlsProps {}

export const PrivatePlayerControls = () => (
  <div class="meta-workspace-card">
    <div class="studio-controls-group">
      <div class="input-field-group">
        <input
          type="text"
          x-model="active.title"
          x-on:input="$store.review.syncStore($store.player.currentIndex, active.title)"
        />
      </div>

      <button
        x-on:click="$store.review.toggleStatus($store.player.currentIndex)"
        type="button"
        class="btn-status"
        x-bind:class="active.status === 'public' ? 'btn-public' : 'btn-private'"
      >
        <span x-text="active.status === 'public' ? 'Public' : 'Private'"></span>
      </button>

      <div class="studio-controls-status-count-container">
        <span
          x-text="$store.review.getCount()"
          class="studio-controls-status-count"
        ></span>
        <span
          x-text="$store.review.getCountPrivate()"
          class="studio-controls-status-count"
        ></span>
      </div>

      <div class="status-action-wrapper">
        {/* Commit Action */}
        <button
          x-show="$store.review.changed"
          x-on:click="$store.review.openCommitModal()"
          type="button"
          class="btn-status btn-public"
        >
          <span>Commit</span>
        </button>
      </div>
    </div>
    <CommitModal />
  </div>
);
