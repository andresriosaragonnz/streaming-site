// =========================================================================
// INSTANT INLINE GRAPH RENDERER (PRE-CALCULATED SUB-NETWORKS)
// =========================================================================

const container = document.getElementById("graph");
const resetBtn = document.getElementById("reset-btn");

if (
  container &&
  (container.clientHeight === 0 || container.clientWidth === 0)
) {
  container.style.width = "100%";
  container.style.height = "100vh";
  container.style.display = "block";
  container.style.position = "relative";
}

const orb = new Orb.Orb(container, {
  simulator: {
    workerUrl: null, // Suppress worker loading
  },
  simulation: {
    isPhysicsEnabled: false, // Static layout
  },
  transition: {
    duration: 0,
  },
});

let currentFocusId = null;

function initNetwork() {
  const rawData = window.__GRAPH_DATA__;
  if (!rawData) {
    requestAnimationFrame(initNetwork);
    return;
  }

  // Bind initial view directly from URL
  focusFromUrlParam();

  window.addEventListener("popstate", () => {
    focusFromUrlParam();
  });
}

function renderGraph(clusterData = null) {
  const data = window.__GRAPH_DATA__ || {};
  let displayNodes = [];
  let displayEdges = [];

  if (clusterData && clusterData.displayNodes) {
    // 1. Direct O(1) Pre-calculated Sub-Network
    currentFocusId = String(clusterData.targetNode.id);
    if (resetBtn) resetBtn.style.display = "block";

    displayNodes = clusterData.displayNodes;
    displayEdges = clusterData.displayEdges;

    orb.data.setDefaultStyle({
      getNodeStyle(node) {
        const isTarget = String(node.id) === currentFocusId;
        const nodeData = node.data || node;
        return {
          size: isTarget ? 16 : 9,
          color: isTarget ? "#ff3e3e" : "#00d2ff",
          label: nodeData.name || nodeData.label || "",
          fontSize: isTarget ? 7 : 4,
          fontColor: "#ffffff",
          x: nodeData.x ?? node.x,
          y: nodeData.y ?? node.y,
        };
      },
      getEdgeStyle(edge) {
        const weight = edge.data?.weight ?? edge.weight ?? 1;
        return {
          color: "#ff3e3e",
          width: Math.min(weight * 1.5, 4),
          opacity: 0.8,
        };
      },
    });
  } else {
    // 2. Full Network fallback
    currentFocusId = null;
    if (resetBtn) resetBtn.style.display = "none";

    displayNodes = data.nodes || [];
    displayEdges = data.edges || [];

    orb.data.setDefaultStyle({
      getNodeStyle(node) {
        const nodeData = node.data || node;
        return {
          size: 7,
          color: "#0072d2",
          label: nodeData.name || nodeData.label || "",
          fontSize: 3.5,
          fontColor: "#ffffff",
          x: nodeData.x ?? node.x,
          y: nodeData.y ?? node.y,
        };
      },
      getEdgeStyle(edge) {
        const weight = edge.data?.weight ?? edge.weight ?? 1;
        return {
          color: weight > 1 ? "#3b82f6" : "#ffffff",
          width: Math.min(weight * 0.6, 3),
          opacity: 0.5,
        };
      },
    });
  }

  // Setup data directly
  orb.data.setup({ nodes: displayNodes, edges: displayEdges });

  // Single pass canvas render and viewport centering
  orb.view.render(() => {
    orb.view.recenter();
    if (container) container.style.opacity = "1";
  });
}

orb.events.on("node-click", (event) => {
  if (event && event.node) {
    const nodeData = event.node.data || event.node;
    const rawArtist =
      nodeData.rawArtist ||
      (nodeData.name || "").toLowerCase().replace(/\s+/g, "_");

    const newUrl = `${window.location.pathname}?artist=${encodeURIComponent(rawArtist)}`;
    window.history.pushState({ artist: rawArtist }, "", newUrl);

    const clusters = window.__GRAPH_DATA__?.artistClusters || {};
    console.log({ clusters });
    const cluster =
      clusters[rawArtist] || clusters[rawArtist.replace(/_/g, " ")];

    renderGraph(cluster);
  }
});

if (resetBtn) {
  resetBtn.addEventListener("click", () => {
    window.history.pushState({}, "", window.location.pathname);
    renderGraph(null);
  });
}

function focusFromUrlParam() {
  const urlParams = new URLSearchParams(window.location.search);
  const targetArtistParam = urlParams.get("artist");

  if (!targetArtistParam) {
    renderGraph(null);
    return;
  }

  const rawKey = targetArtistParam.toLowerCase().trim();
  const normalizedKey = rawKey.replace(/_/g, " ");

  const clusters = window.__GRAPH_DATA__?.artistClusters || {};
  const cluster = clusters[rawKey] || clusters[normalizedKey];

  if (cluster) {
    renderGraph(cluster);
  } else {
    renderGraph(null);
  }
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initNetwork);
} else {
  initNetwork();
}
