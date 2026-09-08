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
 * Safely updates the "See videos" button href and prefetches the target page in the background.
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

    // ⚡ PREFETCH OPTIMIZATION
    // Avoid duplicate prefetch links in the document head
    let prefetchLink = document.querySelector(
      `link[rel="prefetch"][href="${href}"]`,
    );

    if (!prefetchLink) {
      prefetchLink = document.createElement("link");
      prefetchLink.rel = "prefetch";
      prefetchLink.href = href;
      prefetchLink.as = "document";
      document.head.appendChild(prefetchLink);
    }
  }
}
export function renderGraph(customData) {
  const container = document.getElementById("graph");
  if (!container) return;

  const wrapper = document.getElementById("graph-viewport-wrapper");
  const cachedDims = window.graphStore?.dimensions;

  const width =
    cachedDims?.width ||
    (wrapper?.dataset.viewportWidth
      ? parseInt(wrapper.dataset.viewportWidth, 10)
      : 0);
  const height =
    cachedDims?.height ||
    (wrapper?.dataset.viewportHeight
      ? parseInt(wrapper.dataset.viewportHeight, 10)
      : 0);

  if (!width || !height) {
    const rect = container.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;
  }

  const payload = resolveGraphPayload(customData);
  if (!payload || !payload.nodes || !payload.nodes.length) {
    console.warn("⚠️ [Network] No graph payload available.");
    return;
  }

  if (payload.targetNode) {
    const activeName = payload.targetNode.rawArtist || payload.targetNode.name;
    syncSeeVideosLink(activeName);
  }

  const currentFocusId = payload.targetNode
    ? String(payload.targetNode.id)
    : null;

  // ⚡ FAST PATH: Reuse existing Orb instance if already initialized
  if (orbInstance && orbInstance.data) {
    orbInstance.data.setDefaultStyle({
      getNodeStyle(node) {
        const isTarget = currentFocusId
          ? String(node.id) === currentFocusId
          : false;
        const nodeData = node.data || node;
        return {
          size: currentFocusId ? (isTarget ? 16 : 9) : 7,
          color: currentFocusId
            ? isTarget
              ? "#ff3e3e"
              : "#00d2ff"
            : "#0072d2",
          label: nodeData.name || nodeData.label || "",
          fontSize: currentFocusId ? (isTarget ? 7 : 4) : 3.5,
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
          width: Math.min(weight * (currentFocusId ? 1.5 : 0.6), 4),
          opacity: currentFocusId ? 0.8 : 0.5,
        };
      },
    });

    // Update dataset in-place without destroying DOM canvas
    orbInstance.data.setup({
      nodes: payload.nodes,
      edges: payload.edges,
    });

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
    return;
  }

  // Initial Full Render (only executed once when instance is null)
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

    orbInstance.data.setDefaultStyle({
      getNodeStyle(node) {
        const isTarget = currentFocusId
          ? String(node.id) === currentFocusId
          : false;
        const nodeData = node.data || node;
        return {
          size: currentFocusId ? (isTarget ? 16 : 9) : 7,
          color: currentFocusId
            ? isTarget
              ? "#ff3e3e"
              : "#00d2ff"
            : "#0072d2",
          label: nodeData.name || nodeData.label || "",
          fontSize: currentFocusId ? (isTarget ? 7 : 4) : 3.5,
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
          width: Math.min(weight * (currentFocusId ? 1.5 : 0.6), 4),
          opacity: currentFocusId ? 0.8 : 0.5,
        };
      },
    });

    orbInstance.data.setup({
      nodes: payload.nodes,
      edges: payload.edges,
    });

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

    console.log("🕸️ [Network] Graph rendered successfully.");
  } catch (err) {
    console.error("❌ [Network] Failed to render Orb graph:", err);
  }
}

if (typeof window !== "undefined") {
  window.renderGraph = renderGraph;
  window.scheduleGraphRender = scheduleGraphRender;

  const handleGraphStateChange = () => {
    const drawerEl = document.getElementById("graph-drawer-container");
    const isOpen = Boolean(window.graphStore?.isDrawerOpen);

    if (drawerEl) {
      drawerEl.classList.toggle("is-open", isOpen);
      drawerEl.setAttribute("aria-hidden", String(!isOpen));
    }

    if (isOpen) {
      scheduleGraphRender();
    }
  };

  document.addEventListener("click", (event) => {
    const trigger = event.target.closest("[data-action='reset-graph']");
    if (!trigger) return;

    event.preventDefault();

    const perfLinkEl = document.getElementById("performance-link");
    if (perfLinkEl) {
      perfLinkEl.removeAttribute("data-artist");
    }

    if (
      window.graphStore &&
      typeof window.graphStore.setActiveNode === "function"
    ) {
      window.graphStore.setActiveNode("");
    } else if (window.graphStore) {
      window.graphStore.activeNodeLink = "";
    }

    scheduleGraphRender();
  });

  window.addEventListener("modal-ready", () => {
    if (window.graphStore?.isDrawerOpen) {
      scheduleGraphRender();
    }
  });

  window.addEventListener("graph-state-changed", handleGraphStateChange);

  // ⚡ Update graph data when node selection changes
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
