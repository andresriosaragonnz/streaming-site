import { ModalTermsText } from "./ModalTermsText";

export interface CommitModalProps {}

export const CommitModal = () => (
  <div
    x-show="$store.review.isCommitModalOpen"
    x-cloak
    {...{
      "x-on:keydown.escape.window": "$store.review.closeCommitModal()",
    }}
    class="modal-backdrop"
  >
    <div
      {...{
        "x-on:click.away": "$store.review.closeCommitModal()",
      }}
      class="modal-card"
    >
      <div class="modal-header">
        <h2>Review Public Segments</h2>
        <p class="modal-subtitle">
          The following segments will be made public:
        </p>
      </div>

      {/* List of changed segments */}
      <ul class="commit-segment-list">
        <template
          x-for="(seg, idx) in $store.review.getPublicSegments()"
          x-bind:key="seg.id ?? idx"
        >
          <li class="commit-segment-item">
            <span x-text="seg.title" class="segment-title"></span>
            <span
              x-text="seg.status"
              x-bind:class="seg.status === 'public' ? 'status-tag-public' : 'status-tag-private'"
              class="status-tag"
            ></span>
          </li>
        </template>
        <template
          x-for="(seg, idx) in $store.review.gePrivateSegments()"
          x-bind:key="seg.id ?? idx"
        >
          <li class="commit-segment-item">
            <span x-text="seg.title" class="segment-title"></span>
            <span
              x-text="seg.status"
              x-bind:class="seg.status === 'public' ? 'status-tag-public' : 'status-tag-private'"
              class="status-tag"
            ></span>
          </li>
        </template>
      </ul>

      {/* APRA AMCOS DIRECT LICENSING AGREEMENT */}
      <div
        x-data="{ agreed: false, expanded: false }"
        class="license-agreement-container"
      >
        <div class="agreement-header">
          <label class="checkbox-label">
            <input type="checkbox" x-model="agreed" id="apra-agreement-check" />
            <span>
              I agree to the Direct Synchronisation & Online Streaming Licence
            </span>
          </label>

          <button
            type="button"
            class="btn-toggle-terms"
            x-on:click="expanded = !expanded"
            x-text="expanded ? 'Hide Terms ▲' : 'View Terms ▼'"
          >
            View Terms ▼
          </button>
        </div>

        {/* Expandable Terms Container */}
        <ModalTermsText />

        {/* Modal Actions Gated by Checkbox */}
        <div class="modal-actions">
          <button
            x-on:click="$store.review.closeCommitModal()"
            type="button"
            class="btn-modal btn-modal-cancel"
          >
            Cancel
          </button>
          <button
            x-on:click="$store.review.submitCommit()"
            type="button"
            x-bind:disabled="!agreed"
            class="btn-modal btn-modal-confirm"
          >
            Confirm Changes
          </button>
        </div>
      </div>
    </div>
  </div>
);
