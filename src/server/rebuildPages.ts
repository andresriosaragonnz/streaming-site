import { buildPublicNetworkGraph } from "./calculateNetwork";

export interface RebuildPagesResult {
  totalTimeMs: string;
}

export const rebuildPages = async (env: any): Promise<RebuildPagesResult> => {
  const totalStart = performance.now();
  console.log("🚀 [Rebuild] Starting full page rebuild...");

  // 1. Fetch all segments
  const fetchStart = performance.now();
  const sql = `SELECT * FROM segments `;
  const { results: allSegments } = await env.DB.prepare(sql).all();
  console.log(
    `📦 [Rebuild] Fetched ${allSegments.length} segments in ${(performance.now() - fetchStart).toFixed(2)}ms`,
  );

  // 2. Single pass: Format segments, extract artist nodes, and group formatted segments
  const groupStart = performance.now();
  const artistMap = new Map<string, { name: string; rawArtist: string }>();
  const groupedByArtist: Record<string, any[]> = {};
  const len = allSegments.length;
  const formattedSegments = new Array(len);

  for (let i = 0; i < len; i++) {
    const seg = allSegments[i];
    const artistName = seg.artistName;
    formattedSegments[i] = seg;
    if (artistName) {
      if (!artistMap.has(artistName)) {
        artistMap.set(artistName, {
          name: artistName,
          rawArtist: artistName,
        });
        groupedByArtist[artistName] = [];
      }
      groupedByArtist[artistName].push(seg);
    }
  }

  const rawNodes = Array.from(artistMap.values());
  console.log(
    `⚡ [Rebuild] Formatted and grouped ${len} segments across ${rawNodes.length} artists in ${(performance.now() - groupStart).toFixed(2)}ms`,
  );

  // 3. Build public network graph in-memory & pre-stringify JSON
  const graphStart = performance.now();
  const graphDataJS = buildPublicNetworkGraph(formattedSegments, rawNodes);
  const graphDataJsonString = JSON.stringify(graphDataJS);
  console.log(
    `🕸️ [Rebuild] Network graph generated in ${(performance.now() - graphStart).toFixed(2)}ms`,
  );
  await env.PAGE_CACHE.put("graphDataJsonString", graphDataJsonString);
  const totalTimeMs = (performance.now() - totalStart).toFixed(2);
  console.log(`✅ [Rebuild] Complete rebuild finished in ${totalTimeMs}ms`);

  return {
    totalTimeMs,
  };
};
