import { Orb } from "orb-js";

declare global {
  interface Window {
    __GRAPH_DATA__?: {
      nodes: Array<{ id: string; name: string; label: string; x?: number; y?: number }>;
      edges: Array<{ id: string; source: string; target: string; weight?: number }>;
      artistClusters?: Record<string, any>;
      artistLookup?: Record<string, any>;
    };
    renderGraph?: (data?: any) => void;
  }
}

let orbInstance: Orb | null = null;

/**
 * Initializes or re-renders the Orb.js graph visualization inside #graph.
 */
export function renderGraph(customData?: any): void {
  const container = document.getElementById("graph");
  if (!container) {
    console.warn("⚠️ [Network] Container #graph not found in DOM.");
    return;
  }

  // Ensure container has visible dimensions before rendering
  const rect = container.getBoundingClientRect();
  if (rect.width === 0 || rect.height === 0) {
    console.warn("⚠️ [Network] #graph container has 0 dimensions. Render deferred.");
    return;
  }

  const graphData = customData || window.__GRAPH_DATA__;
  if (!graphData || !graphData.nodes || !graphData.edges) {
    console.warn("⚠️ [Network] No valid __GRAPH_DATA__ found.");
    return;
  }

  // Clean up existing instance before re-initializing
  if (orbInstance) {
    try {
      orbInstance.destroy();
    } catch (e) {
      console.error("Error destroying previous Orb instance:", e);
    }
    orbInstance = null;
  }

  container.innerHTML = "";

  try {
    orbInstance = new Orb(container);

    // Load graph payload
    orbInstance.data.setup({
      nodes: graphData.nodes,
      edges: graphData.edges,
    });

    // Default graph styling and view configuration
    orbInstance.views.setup({
      node: (node) => ({
        label: node.data.label || node.data.name,
        color: "#13bf11",
        size: 6,
      }),
      edge: () => ({
        color: "#2a324b",
        width: 1,
      }),
    });

    // Node click delegation
    orbInstance.events.on("node-click", (event: any) => {
      const node = event.node;
      if (!node) return;

      const artistName = node.data.rawArtist || node.data.name;
      const targetLink = `/artist/${encodeURIComponent(artistName)}`;

      if (window.reviewStore?.state) {
        window.reviewStore.state.activeNodeLink = targetLink;
      }

      window.dispatchEvent(
        new CustomEvent("node-selected", {
          detail: { link: targetLink, artist: artistName },
        }),
      );

      window.dispatchEvent(new CustomEvent("review-state-changed"));
    });

    orbInstance.render();
    console.log("🕸️ [Network] Orb graph rendered successfully.");
  } catch (err) {
    console.error("❌ [Network] Failed to render Orb graph:", err);
  }
}

// Global window handle for binder invocation
window.renderGraph = renderGraph;

/**
 * Event Listeners & Lifecycle Triggers
 */
if (typeof window !== "undefined") {
  // Trigger render whenever the drawer emits modal-ready
  window.addEventListener("modal-ready", () => {
    requestAnimationFrame(() => {
      renderGraph();
    });
  });

  // Handle window resize events
  window.addEventListener("resize", () => {
    if (
      orbInstance &&
      document.getElementById("graph-drawer-container")?.classList.contains("is-open")
    ) {
      renderGraph();
    }
  });

  // Initial load pass if container is already visible
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => {
      if (document.getElementById("graph-drawer-container")?.classList.contains("is-open")) {
        renderGraph();
      }
    });
  } else {
    if (document.getElementById("graph-drawer-container")?.classList.contains("is-open")) {
      renderGraph();
    }
  }
}