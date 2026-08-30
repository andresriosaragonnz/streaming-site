export interface GraphNode {
  id: string;
  name: string;
  label: string;
  rawArtist: string;
  x: number;
  y: number;
}

export interface GraphEdge {
  id: string;
  source: string;
  target: string;
  start: string;
  end: string;
  weight: number;
}

export interface SubNetwork {
  targetNode: GraphNode;
  displayNodes: GraphNode[];
  displayEdges: GraphEdge[];
}

export interface OptimizedGraphData {
  nodes: GraphNode[];
  edges: GraphEdge[];
  artistClusters: Record<string, SubNetwork>;
  artistLookup: Record<string, GraphNode>;
}

export interface Segment {
  id: string;
  artistId: string;
  title: string;
  artistName: string;
  eventDate: string;
  venueName: string;
  status: "public" | "private" | string;
  [key: string]: any;
}

// -------------------------------------------------------------------------
// 1. In-Memory Edge Calculation (Replaces D1 SQL Query)
// -------------------------------------------------------------------------
export function calculateEdgesFromSegments(segments: Segment[]) {
  const publicSegments = segments.filter((s) => s.status === "public");

  // Group artists by event (date + venue)
  const eventMap = new Map<string, Set<string>>();

  for (const seg of publicSegments) {
    const eventKey = `${seg.eventDate}_${seg.venueName}`;
    if (!eventMap.has(eventKey)) {
      eventMap.set(eventKey, new Set());
    }
    eventMap.get(eventKey)!.add(seg.artistName);
  }

  // Count unique co-performances for each artist pair
  const pairCounts = new Map<string, number>();

  for (const artistsSet of eventMap.values()) {
    const artists = Array.from(artistsSet).sort();

    for (let i = 0; i < artists.length; i++) {
      for (let j = i + 1; j < artists.length; j++) {
        const pairKey = `${artists[i]}:::${artists[j]}`;
        pairCounts.set(pairKey, (pairCounts.get(pairKey) || 0) + 1);
      }
    }
  }

  const rawEdges: { artist1: string; artist2: string; weight: number }[] = [];

  for (const [pairKey, weight] of pairCounts.entries()) {
    const [artist1, artist2] = pairKey.split(":::");
    rawEdges.push({ artist1, artist2, weight });
  }

  return rawEdges;
}

// -------------------------------------------------------------------------
// 2. Full Network Graph Builder
// -------------------------------------------------------------------------
export function buildPublicNetworkGraph(
  segments: Segment[],
  rawNodes: { name: string; rawArtist: string }[],
): OptimizedGraphData {
  const totalNodes = rawNodes.length;
  const artistToIdMap = new Map<string, string>();

  // Step 1: Generate nodes with radial coordinates
  const nodes: GraphNode[] = rawNodes.map((n, idx) => {
    const id = String(idx + 1);
    artistToIdMap.set(n.name, id);

    const angle = (idx / totalNodes) * 2 * Math.PI;
    const radius = 600 + (idx % 3) * 150;

    return {
      id,
      name: n.name,
      label: n.name.replace(/_/g, " "),
      rawArtist: n.rawArtist,
      x: Math.round(Math.cos(angle) * radius),
      y: Math.round(Math.sin(angle) * radius),
    };
  });

  const artistLookup: Record<string, GraphNode> = {};

  nodes.forEach((node) => {
    const rawKey = node.rawArtist.toLowerCase().trim();
    const nameKey = node.name.toLowerCase().trim();

    if (rawKey) artistLookup[rawKey] = node;
    if (nameKey) artistLookup[nameKey] = node;
    if (rawKey.includes("_")) {
      artistLookup[rawKey.replace(/_/g, " ")] = node;
    }
  });

  // Step 2: Compute edges in-memory from segment array
  const rawEdges = calculateEdgesFromSegments(segments);

  const edges: GraphEdge[] = [];
  const adjacencyNodesMap = new Map<string, Set<string>>();

  let edgeCounter = 0;

  for (const e of rawEdges) {
    const src = artistToIdMap.get(e.artist1);
    const tgt = artistToIdMap.get(e.artist2);

    if (src && tgt) {
      const edgeId = `e-${edgeCounter++}`;
      const edgeObj: GraphEdge = {
        id: edgeId,
        source: src,
        target: tgt,
        start: src,
        end: tgt,
        weight: e.weight,
      };

      edges.push(edgeObj);

      if (!adjacencyNodesMap.has(src)) adjacencyNodesMap.set(src, new Set());
      if (!adjacencyNodesMap.has(tgt)) adjacencyNodesMap.set(tgt, new Set());

      adjacencyNodesMap.get(src)!.add(tgt);
      adjacencyNodesMap.get(tgt)!.add(src);
    }
  }

  // Step 3: Pre-calculate artist sub-networks directly in memory
  const artistClusters: Record<string, SubNetwork> = {};

  nodes.forEach((targetNode) => {
    const focusId = targetNode.id;
    const neighborSet = adjacencyNodesMap.get(focusId) || new Set();

    const focusClusterIds = new Set([focusId, ...Array.from(neighborSet)]);

    const displayNodes = nodes.filter((n) => focusClusterIds.has(n.id));
    const displayEdges = edges.filter(
      (e) => focusClusterIds.has(e.source) && focusClusterIds.has(e.target),
    );

    const subNet: SubNetwork = {
      targetNode,
      displayNodes,
      displayEdges,
    };

    const rawKey = targetNode.rawArtist.toLowerCase().trim();
    const nameKey = targetNode.name.toLowerCase().trim();

    if (rawKey) artistClusters[rawKey] = subNet;
    if (nameKey) artistClusters[nameKey] = subNet;
    if (rawKey.includes("_")) {
      artistClusters[rawKey.replace(/_/g, " ")] = subNet;
    }
  });

  return { nodes, edges, artistClusters, artistLookup };
}
