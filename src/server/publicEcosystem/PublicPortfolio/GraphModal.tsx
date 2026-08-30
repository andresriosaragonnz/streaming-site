export interface GraphModalProps {}

export const GraphModal = () => (
  <div
    x-cloak
    x-data="{ activeNodeLink: '' }"
    {...{
      "x-on:keydown.escape.window": "isGraphDrawerOpen = false",
      "x-on:open-graph-modal.window":
        "$nextTick(() => { window.dispatchEvent(new CustomEvent('modal-ready')); })",
      "x-on:node-selected.window": "activeNodeLink = $event.detail.link",
    }}
  >
    {/* Overlay Backdrop */}
    <div
      class="graph-drawer-overlay"
      x-bind:class="{ 'is-open': isGraphDrawerOpen }"
      x-on:click="isGraphDrawerOpen = false"
    ></div>

    {/* Left-Sliding Panel */}
    <aside
      class="graph-drawer-panel"
      x-bind:class="{ 'is-open': isGraphDrawerOpen }"
    >
      {/* Header Controls */}
      <div
        id="reset-btn-container"
        style="margin-bottom: 16px; display: flex; gap: 8px; justify-content: flex-end; align-items: center;"
      >
        <button id="reset-btn" class="reset-btn" type="button">
          Show Full Network
        </button>

        <button
          type="button"
          class="reset-btn"
          x-on:click="isGraphDrawerOpen = false"
        >
          Close
        </button>
      </div>

      {/* Graph Canvas Container */}
      <div
        id="graph"
        style="width: 100%; flex: 1; position: relative; background: #040714; border-radius: 8px; overflow: hidden;"
      ></div>

      {/* Bottom Centered 80% Action Bar */}
      <div
        x-show="activeNodeLink"
        style="margin-top: 16px; display: flex; justify-content: center; align-items: center; width: 100%;"
      >
        <a
          id="see-videos-btn"
          class="reset-btn"
          x-bind:href="'/' + activeNodeLink"
          style="text-decoration: none; padding: 14px 0; font-weight: bold; width: 80%; text-align: center; display: block;"
        >
          See videos
        </a>
      </div>
    </aside>
  </div>
);
