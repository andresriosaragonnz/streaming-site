let orbInstance = null;
let rafId = null;

export function scheduleGraphRender(customData) {
  if (rafId) {
    cancelAnimationFrame(rafId);
  }
  rafId = requestAnimationFrame(() => {
    renderGraph(customData);
    rafId = null;
  });
}

/**
 * Resolves the graph payload using pre-calculated artistClusters when available.
 */
function resolveGraphPayload(customData) {
  const rawData = customData || window.__GRAPH_DATA__;
  if (!rawData) return null;

  const activeLink = window.graphStore?.activeNodeLink;
  const perfLinkEl = document.getElementById("performance-link");

  const rawArtist =
    (activeLink ? activeLink.replace(/^artist\//, "") : "") ||
    perfLinkEl?.getAttribute("data-artist") ||
    "";

  const currentArtist = decodeURIComponent(rawArtist).toLowerCase().trim();

  if (currentArtist && rawData.artistClusters) {
    const key = currentArtist;
    const cluster =
      rawData.artistClusters[key] ||
      rawData.artistClusters[key.replace(/_/g, " ")];

    if (cluster) {
      return {
        nodes: cluster.displayNodes,
        edges: cluster.displayEdges,
        targetNode: cluster.targetNode,
      };
    }
  }

  return {
    nodes: rawData.nodes || [],
    edges: rawData.edges || [],
    targetNode: null,
  };
}

/**
 * Safely updates the "See videos" button href attribute in the DOM.
 */
function syncSeeVideosLink(targetArtist) {
  const seeVideosBtn = document.getElementById("see-videos-btn");
  if (!seeVideosBtn) return;

  if (targetArtist) {
    const formattedArtist = encodeURIComponent(
      targetArtist.toLowerCase().replace(/\s+/g, "_"),
    );
    const href = `/${formattedArtist}`;
    seeVideosBtn.setAttribute("href", href);
  }
}

export function renderGraph(customData) {
  const container = document.getElementById("graph");
  if (!container) return;

  const rect = container.getBoundingClientRect();
  if (rect.width === 0 || rect.height === 0) return;

  const payload = resolveGraphPayload(customData);
  if (!payload || !payload.nodes || !payload.nodes.length) {
    console.warn("⚠️ [Network] No graph payload available.");
    return;
  }

  // Sync "See videos" button target artist
  if (payload.targetNode) {
    const activeName = payload.targetNode.rawArtist || payload.targetNode.name;
    syncSeeVideosLink(activeName);
  }

  // Clean up existing instance
  if (orbInstance) {
    try {
      if (typeof orbInstance.destroy === "function") {
        orbInstance.destroy();
      } else if (typeof orbInstance.view?.unload === "function") {
        orbInstance.view.unload();
      }
    } catch (e) {}
    orbInstance = null;
  }

  container.innerHTML = "";

  try {
    const OrbConstructor =
      (window.Orb && typeof window.Orb.Orb === "function" && window.Orb.Orb) ||
      (window.Orb &&
        typeof window.Orb.default === "function" &&
        window.Orb.default) ||
      (typeof window.Orb === "function" && window.Orb);

    if (!OrbConstructor) return;

    orbInstance = new OrbConstructor(container, {
      simulator: {
        workerUrl: null,
      },
      simulation: {
        isPhysicsEnabled: false,
      },
      transition: {
        duration: 0,
      },
    });

    if (!orbInstance || !orbInstance.data) return;

    const currentFocusId = payload.targetNode
      ? String(payload.targetNode.id)
      : null;

    // Apply the working setDefaultStyle configuration for white text
    orbInstance.data.setDefaultStyle({
      getNodeStyle(node) {
        const isTarget = currentFocusId
          ? String(node.id) === currentFocusId
          : false;
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
          color: currentFocusId
            ? "#ff3e3e"
            : weight > 1
              ? "#3b82f6"
              : "#ffffff",
          width: Math.min(weight * 1.5, 4),
          opacity: currentFocusId ? 0.8 : 0.5,
        };
      },
    });

    // Load pre-computed nodes and edges
    orbInstance.data.setup({
      nodes: payload.nodes,
      edges: payload.edges,
    });

    // Node click delegation
    if (orbInstance.events && typeof orbInstance.events.on === "function") {
      orbInstance.events.on("node-click", (event) => {
        const node = event ? event.node : null;
        if (!node) return;

        const nodeData = node.data || node;
        const artistName = nodeData.rawArtist || nodeData.name;
        const targetLink = `artist/${encodeURIComponent(artistName)}`;

        syncSeeVideosLink(artistName);

        if (window.graphStore) {
          window.graphStore.setActiveNode(targetLink);
        }

        window.dispatchEvent(
          new CustomEvent("node-selected", {
            detail: { link: targetLink, artist: artistName },
          }),
        );
      });
    }

    // Render pass & camera auto-center
    if (orbInstance.view && typeof orbInstance.view.render === "function") {
      orbInstance.view.render(() => {
        if (typeof orbInstance.view.recenter === "function") {
          orbInstance.view.recenter();
        }
      });
    } else if (typeof orbInstance.render === "function") {
      orbInstance.render();
      if (typeof orbInstance.recenter === "function") {
        orbInstance.recenter();
      }
    }

    console.log("🕸️ [Network] Graph rendered with crisp white fontColor.");
  } catch (err) {
    console.error("❌ [Network] Failed to render Orb graph:", err);
  }
}

if (typeof window !== "undefined") {
  window.renderGraph = renderGraph;
  window.scheduleGraphRender = scheduleGraphRender;

  const handleGraphStateChange = () => {
    const drawerEl = document.getElementById("graph-drawer-container");

    // Rely strictly on store state to avoid stale DOM class reading
    const isOpen = Boolean(window.graphStore?.isDrawerOpen);

    if (drawerEl) {
      drawerEl.classList.toggle("is-open", isOpen);
      drawerEl.setAttribute("aria-hidden", String(!isOpen));
    }

    if (isOpen) {
      scheduleGraphRender();
    }
  };

  window.addEventListener("modal-ready", () => {
    if (window.graphStore?.isDrawerOpen) {
      scheduleGraphRender();
    }
  });

  window.addEventListener("graph-state-changed", handleGraphStateChange);

  window.addEventListener("node-selected", (e) => {
    if (e.detail?.artist) {
      syncSeeVideosLink(e.detail.artist);
    }
    if (window.graphStore?.isDrawerOpen) {
      scheduleGraphRender();
    }
  });

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", handleGraphStateChange);
  } else {
    handleGraphStateChange();
  }
}
