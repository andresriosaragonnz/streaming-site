export interface CommitModalProps {
  segments: any[];
}

export const CommitModal = ({ segments }: CommitModalProps) => (
  <div
    id="commit-modal-container"
    class="modal-backdrop"
    aria-hidden="true"
    data-bind-show="Boolean(review.state?.isCommitModalOpen)"
    style="display: none;"
  >
    {/* Explicit backdrop overlay that closes the modal when clicked outside */}
    <div
      class="modal-backdrop-overlay"
      data-action="close-modal"
      data-modal-id="commit-modal-container"
    ></div>

    <div class="modal-card">
      <div class="modal-header">
        <h2>Review Public Segments</h2>
        <p class="modal-subtitle">The following segments will be modified:</p>
      </div>

      {/* Public Segments List */}
      <ul class="commit-segment-list">
        {segments?.map((segment, index) => (
          <li
            class="commit-segment-item"
            data-bind-show={`Boolean(review.tracks[${index}]?.isPublic)`}
          >
            <span
              class="segment-title"
              data-bind-text={`review.tracks[${index}]?.title || '${segment.title}'`}
            >
              {segment.title}
            </span>
            <span class="status-tag status-tag-public">public</span>
          </li>
        ))}
      </ul>

      {/* Private Segments List */}
      <ul class="commit-segment-list">
        {segments?.map((segment, index) => (
          <li
            class="commit-segment-item"
            data-bind-show={`!review.tracks[${index}]?.isPublic`}
          >
            <span
              class="segment-title"
              data-bind-text={`review.tracks[${index}]?.title || '${segment.title}'`}
            >
              {segment.title}
            </span>
            <span class="status-tag status-tag-private">private</span>
          </li>
        ))}
      </ul>

      {/* APRA AMCOS DIRECT LICENSING AGREEMENT */}
      <div class="license-agreement-container">
        <div class="agreement-header">
          <label class="checkbox-label">
            <input
              type="checkbox"
              id="apra-agreement-check"
              data-action="toggle-license-check"
            />
            <span>
              I agree to the Direct Synchronisation &amp; Online Streaming
              Licence
            </span>
          </label>

          <button
            type="button"
            class="btn-toggle-terms"
            data-action="toggle-class"
            data-target="#contract-terms"
            data-class="hidden"
          >
            View Terms ▼
          </button>
        </div>

        {/* Expandable Terms Container */}
        <div id="contract-terms" class="contract-body hidden">
          <h4>DIRECT SYNCHRONISATION AND ONLINE STREAMING LICENCE AGREEMENT</h4>
          <p>
            <strong>1. PARTIES</strong>
            <br />
            This Agreement is between the Platform and the undersigned
            artist/copyright owner ("Licensor").
          </p>
          <p>
            <strong>2. GRANT OF LICENCE</strong>
            <br />
            The Licensor grants the Platform a worldwide, non-exclusive,
            royalty-free, direct licence to:
            <br />
            a) Synchronize the musical composition and sound recording entitled{" "}
            <strong data-bind-text="review.active?.title || 'the selected works'">
              the selected works
            </strong>{" "}
            with video footage uploaded by the videographer.
            <br />
            b) Stream, transmit, and display the resulting audiovisual work on
            the Platform's website and related non-commercial channels.
          </p>
          <p>
            <strong>3. DIRECT LICENSING DECLARATION (APRA AMCOS BYPASS)</strong>
            <br />
            The Licensor acknowledges that they retain full ownership of the
            Work. Pursuant to APRA AMCOS direct licensing rules, the Licensor
            explicitly authorizes the Platform to stream and synchronize the
            Work without requiring third-party licensing or fee collection from
            APRA AMCOS or PPCA.
          </p>
          <p>
            <strong>4. WARRANTIES &amp; INDEMNITY</strong>
            <br />
            The Licensor warrants that:
            <br />
            a) They are the sole creator and copyright owner of the Work.
            <br />
            b) The Work contains no unlicensed third-party samples.
            <br />
            c) They agree to indemnify and hold harmless the Platform against
            any third-party copyright demands.
          </p>
          <p>
            <strong>5. TERM &amp; TERMINATION</strong>
            <br />
            This licence remains in effect indefinitely until revoked in
            writing.
          </p>
        </div>

        {/* Modal Actions */}
        <div class="modal-actions">
          <button
            type="button"
            class="btn-modal btn-modal-cancel"
            data-action="close-modal"
            data-modal-id="commit-modal-container"
          >
            Cancel
          </button>
          <button
            type="button"
            class="btn-modal btn-modal-confirm"
            data-action="submit-commit"
            disabled
          >
            Confirm Changes
          </button>
        </div>
      </div>
    </div>
  </div>
);
