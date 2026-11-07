let orbInstance = null;
let rafId = null;
let orbLoadPromise = null;

/**
 * Lazily loads the heavy Orb bundle on first graph render.
 */
function ensureOrbLoaded() {
  if (typeof window !== "undefined" && window.Orb) {
    return Promise.resolve(true);
  }
  if (orbLoadPromise) return orbLoadPromise;

  orbLoadPromise = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = "/js/orb.js";
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => {
      orbLoadPromise = null;
      reject(new Error("Failed to load /js/orb.js"));
    };
    document.head.appendChild(script);
  });
  return orbLoadPromise;
}

export function scheduleGraphRender(customData, isFull = false) {
  if (rafId) {
    cancelAnimationFrame(rafId);
  }
  rafId = requestAnimationFrame(() => {
    void renderGraph(customData, isFull);
    rafId = null;
  });
}

/**
 * Resolves the graph payload using pre-calculated artistClusters when available.
 */
function resolveGraphPayload(customData, isFull = false) {
  const rawData = customData || window.__GRAPH_DATA__;
  if (!rawData) return null;

  const activeLink = window.graphStore?.activeNodeLink;
  const perfLinkEl = document.getElementById("artist-name");

  const rawArtist =
    (activeLink ? activeLink.replace(/^artist\//, "") : "") ||
    perfLinkEl?.getAttribute("data-artist") ||
    "";

  const currentArtist = isFull
    ? null
    : decodeURIComponent(rawArtist).toLowerCase().trim();

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

export async function renderGraph(customData, isFull = false) {
  const container = document.getElementById("graph");
  if (!container) return;

  const orbReady = ensureOrbLoaded().catch((err) => {
    console.error("❌ [Network] Failed to load Orb:", err);
    return false;
  });

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

  const payload = resolveGraphPayload(customData, isFull);
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
          label: String(nodeData.label || nodeData.name || "").replace(/_/g, " "),
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
  const orbLoaded = await orbReady;
  if (!orbLoaded) return;

  // Another call may have constructed the instance while Orb was loading.
  if (orbInstance) return;

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
          label: String(nodeData.label || nodeData.name || "").replace(/_/g, " "),
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

    // Drawer class is owned by the binder's data-bind-class.
    if (drawerEl) {
      drawerEl.setAttribute("aria-hidden", String(!isOpen));
    }

    if (isOpen) {
      scheduleGraphRender();
    }
  };

  window.addEventListener("graph-state-changed", handleGraphStateChange);

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", handleGraphStateChange);
  } else {
    handleGraphStateChange();
  }

  // Standalone status page: render the full network once layout is settled.
  const renderStatusGraph = () => {
    if (!document.getElementById("status-graph")) return;
    scheduleGraphRender(null, true);
  };

  if (document.readyState === "complete") {
    renderStatusGraph();
  } else {
    window.addEventListener("load", renderStatusGraph, { once: true });
  }
}
