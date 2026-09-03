export interface GraphModalProps {}

export const GraphModal = () => (
  <div id="graph-drawer-container">
    {/* Overlay Backdrop */}
    <div
      class="graph-drawer-overlay"
      data-action="close-modal"
      data-modal-id="graph-drawer-container"
    ></div>

    {/* Left-Sliding Panel */}
    <aside class="graph-drawer-panel">
      {/* Header Controls */}
      <div
        id="reset-btn-container"
        style="margin-bottom: 16px; display: flex; gap: 8px; justify-content: flex-end; align-items: center;"
      >
        <button
          id="reset-btn"
          class="reset-btn"
          type="button"
          data-action="reset-graph"
        >
          Show Full Network
        </button>

        <button
          type="button"
          class="reset-btn"
          data-action="close-modal"
          data-modal-id="graph-drawer-container"
        >
          Close
        </button>
      </div>

      {/* Graph Canvas Container */}
      <div
        id="graph"
        style="width: 100%; flex: 1; position: relative; background: #040714; border-radius: 8px; overflow: hidden;"
      ></div>

      {/* Bottom Centered Action Bar */}
      <div
        id="see-videos-wrapper"
        data-bind-show="Boolean(review.activeNodeLink)"
        style="margin-top: 16px; justify-content: center; align-items: center; width: 100%;"
      >
        <a
          id="see-videos-btn"
          class="reset-btn"
          href=""
          data-bind-href="review.activeNodeLink || ''"
          style="text-decoration: none; padding: 14px 0; font-weight: bold; width: 80%; text-align: center; display: block;"
        >
          See videos
        </a>
      </div>
    </aside>
  </div>
);
