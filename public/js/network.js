const container = document.getElementById("graph");
const resetBtn = document.getElementById("reset-btn");
const orb = new Orb.Orb(container);

let allNodes = [];
let allEdges = [];
let currentFocusId = null;

// 1. Fetch pre-processed JSON output
async function initNetwork() {
  try {
    const response = await fetch("/data/network.json");
    const data = await response.json();
    allNodes = data.nodes;
    allEdges = data.edges;

    // Sync initial view state with address bar
    focusFromUrlParam();

    // Handle browser Back/Forward navigation buttons
    window.addEventListener("popstate", () => {
      focusFromUrlParam();
    });
  } catch (err) {
    console.error("Failed to load pre-processed network data:", err);
  }
}

// 2. Render Subgraph Cluster or Master Graph
function renderGraph(targetNode = null) {
  let displayNodes = allNodes;
  let displayEdges = allEdges;

  if (targetNode) {
    currentFocusId = String(targetNode.id);
    resetBtn.style.display = "block";

    const connectedEdgeNodeIds = new Set(
      allEdges
        .filter(
          (e) =>
            String(e.source) === currentFocusId ||
            String(e.target) === currentFocusId,
        )
        .map((e) =>
          String(e.source) === currentFocusId
            ? String(e.target)
            : String(e.source),
        ),
    );

    const focusClusterIds = new Set([currentFocusId, ...connectedEdgeNodeIds]);

    displayNodes = allNodes.filter((n) => focusClusterIds.has(String(n.id)));
    displayEdges = allEdges.filter(
      (e) =>
        focusClusterIds.has(String(e.source)) &&
        focusClusterIds.has(String(e.target)),
    );

    orb.data.setDefaultStyle({
      getNodeStyle(node) {
        const isTarget = String(node.id) === currentFocusId;
        return {
          size: isTarget ? 16 : 9,
          color: isTarget ? "#ff3e3e" : "#00d2ff",
          label: node.data.name,
          fontSize: isTarget ? 7 : 4,
          fontColor: "#ffffff",
        };
      },
      getEdgeStyle(edge) {
        return {
          color: "#ff3e3e",
          width: Math.min(edge.data.weight * 1.5, 4),
          opacity: 0.8,
        };
      },
    });
  } else {
    currentFocusId = null;
    resetBtn.style.display = "none";

    orb.data.setDefaultStyle({
      getNodeStyle(node) {
        return {
          size: 7,
          color: "#0072d2",
          label: node.data.name,
          fontSize: 3.5,
          fontColor: "#ffffff",
        };
      },
      getEdgeStyle(edge) {
        return {
          color: edge.data.weight > 1 ? "#3b82f6" : "#ffffff",
          width: Math.min(edge.data.weight * 0.6, 3),
          opacity: 0.5,
        };
      },
    });
  }

  orb.data.setup({ nodes: displayNodes, edges: displayEdges });

  orb.view.setSettings({
    simulation: {
      isPhysicsEnabled: true,
      gravity: targetNode ? -800 : -1200,
      springLength: targetNode ? 120 : 90,
    },
  });

  orb.view.render(() => {
    orb.view.recenter();
  });
}

// 3. Navigate to URL on Click
orb.events.on("node-click", (event) => {
  if (event && event.node) {
    const rawArtist =
      event.node.data.rawArtist || event.node.data.name.replace(/\s+/g, "_");
    const newUrl = `${window.location.pathname}?artist=${encodeURIComponent(rawArtist)}`;

    // Update address bar without triggering full page reload
    window.history.pushState({ artist: rawArtist }, "", newUrl);

    // Render graph for selected artist
    renderGraph(event.node);
  }
});

// 4. Reset Button Handler
resetBtn.addEventListener("click", () => {
  window.history.pushState({}, "", window.location.pathname);
  renderGraph(null);
});

// 5. URL Param Resolver
function focusFromUrlParam() {
  const urlParams = new URLSearchParams(window.location.search);
  const targetArtistParam = urlParams.get("artist");

  if (!targetArtistParam) {
    renderGraph(null);
    return;
  }

  const normalizedTarget = targetArtistParam
    .toLowerCase()
    .replace(/[_]/g, " ")
    .trim();

  const targetNodeObj = allNodes.find(
    (n) =>
      n.name.toLowerCase() === normalizedTarget ||
      n.rawArtist.toLowerCase() === targetArtistParam.toLowerCase(),
  );

  if (targetNodeObj) {
    renderGraph(targetNodeObj);
  } else {
    renderGraph(null);
  }
}

// Initialize
initNetwork();
