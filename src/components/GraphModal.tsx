import { ConstellationBtn } from "./ConstellationBtn";

export const GraphModal = () => (
  <div
    id="graph-drawer-container"
    data-bind-class="{ 'is-open': graph.isDrawerOpen }"
    aria-hidden="true"
    class=""
  >
    {/* Overlay Backdrop */}
    <div class="graph-drawer-overlay" data-action="close-graph-modal"></div>

    {/* Left-Sliding Panel */}
    <aside class="graph-drawer-panel">
      {/* Header Controls */}
      <header id="reset-btn-container">
        <button
          id="reset-btn"
          class="reset-btn btn-icon-only"
          type="button"
          title="Show Full Network"
          aria-label="Show Full Network"
          data-action="reset-graph"
        >
          <ConstellationBtn />
        </button>
        <a
          id="see-videos-btn"
          class="reset-btn graph-action-link"
          href="#"
          data-bind-href="graph.activeNodeHref"
        >
          See videos
        </a>
        <button type="button" class="reset-btn" data-action="close-graph-modal">
          X
        </button>
      </header>

      {/* Graph Canvas Container with Optional Pre-calculated Bounding Attributes */}
      <main id="graph-viewport-wrapper">
        <div id="graph"></div>
      </main>
    </aside>
  </div>
);
