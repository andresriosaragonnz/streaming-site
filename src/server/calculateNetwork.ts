// src/utils/graphBuilder.ts

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

export async function buildPublicNetworkGraph(
  db: D1Database,
): Promise<OptimizedGraphData> {
  // 1. Fetch public nodes from segments table
  const { results: rawNodes } = await db
    .prepare(
      `
    SELECT DISTINCT 
      artistName AS name,
      LOWER(REPLACE(artistName, ' ', '_')) AS rawArist
    FROM segments
    WHERE status = 'public'
    ORDER BY artistName ASC
  `,
    )
    .all();

  const totalNodes = rawNodes.length;
  const artistToIdMap = new Map<string, string>();

  // Generate clean radial fallback coordinates without d3-force
  const nodes: GraphNode[] = rawNodes.map((n: any, idx: number) => {
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

  const nodeMap = new Map<string, GraphNode>();
  const artistLookup: Record<string, GraphNode> = {};

  nodes.forEach((node) => {
    nodeMap.set(node.id, node);

    const rawKey = node.rawArtist.toLowerCase().trim();
    const nameKey = node.name.toLowerCase().trim();

    if (rawKey) artistLookup[rawKey] = node;
    if (nameKey) artistLookup[nameKey] = node;
    if (rawKey.includes("_")) {
      artistLookup[rawKey.replace(/_/g, " ")] = node;
    }
  });

  // 2. Fetch public edges (co-occurrences at same venue & eventDate)
  const { results: rawEdges } = await db
    .prepare(
      `
    SELECT 
      s1.artistName AS artist1,
      s2.artistName AS artist2,
      COUNT(DISTINCT s1.eventDate || '_' || s1.venueName) AS weight
    FROM segments s1
    INNER JOIN segments s2 
      ON s1.venueName = s2.venueName 
      AND s1.eventDate = s2.eventDate 
      AND s1.artistName < s2.artistName
    WHERE s1.status = 'public' 
      AND s2.status = 'public'
    GROUP BY s1.artistName, s2.artistName
  `,
    )
    .all();

  const edges: GraphEdge[] = [];
  const adjacencyNodesMap = new Map<string, Set<string>>();
  const adjacencyEdgesMap = new Map<string, Set<string>>();

  let edgeCounter = 0;

  for (const e of rawEdges as any[]) {
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
        weight: Number(e.weight),
      };

      edges.push(edgeObj);

      if (!adjacencyNodesMap.has(src)) adjacencyNodesMap.set(src, new Set());
      if (!adjacencyNodesMap.has(tgt)) adjacencyNodesMap.set(tgt, new Set());
      if (!adjacencyEdgesMap.has(src)) adjacencyEdgesMap.set(src, new Set());
      if (!adjacencyEdgesMap.has(tgt)) adjacencyEdgesMap.set(tgt, new Set());

      adjacencyNodesMap.get(src)!.add(tgt);
      adjacencyNodesMap.get(tgt)!.add(src);
      adjacencyEdgesMap.get(src)!.add(edgeId);
      adjacencyEdgesMap.get(tgt)!.add(edgeId);
    }
  }

  // 3. Pre-calculate artist sub-networks directly on the server
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
