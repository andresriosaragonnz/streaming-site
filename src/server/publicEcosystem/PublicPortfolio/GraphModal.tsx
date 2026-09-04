export interface GraphModalProps {}

export const GraphModal = () => (
  <div
    id="graph-drawer-container"
    data-bind-class-toggle="is-open:graph.isDrawerOpen"
    aria-hidden="true"
  >
    {/* Overlay Backdrop */}
    <div class="graph-drawer-overlay" data-action="close-graph-modal"></div>

    {/* Left-Sliding Panel */}
    <aside class="graph-drawer-panel">
      {/* Header Controls */}
      <header id="reset-btn-container">
        <button
          id="reset-btn"
          class="reset-btn"
          type="button"
          data-action="reset-graph"
        >
          Show Full Network
        </button>

        <button type="button" class="reset-btn" data-action="close-graph-modal">
          Close
        </button>
      </header>

      {/* Graph Canvas Container */}
      <main id="graph-viewport-wrapper">
        <div id="graph"></div>
      </main>

      {/* Bottom Action Bar */}
      <footer
        id="see-videos-wrapper"
        data-bind-show="Boolean(graph.activeNodeLink)"
      >
        <a
          id="see-videos-btn"
          class="reset-btn graph-action-link"
          href="#"
          data-bind-href="graph.activeNodeHref"
        >
          See videos
        </a>
      </footer>
    </aside>
  </div>
);
