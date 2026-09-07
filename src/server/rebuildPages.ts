import { buildPublicNetworkGraph } from "./calculateNetwork";
import { renderPublicEcosystem } from "./publicEcosystem/renderPublicEcosystem";
import { purgeStalePages } from "./purgeStale";
import { savePagesToTarget } from "./savePagesToTarget";
import { formatSegment } from "../formatSegments";

export interface RebuildPagesResult {
  pagesCount: number;
  totalTimeMs: string;
}

export const rebuildPages = async (env: any): Promise<RebuildPagesResult> => {
  const totalStart = performance.now();
  const performanceCache = {} as any;
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
    const formatted = formatSegment(seg, performanceCache);
    formattedSegments[i] = formatted;
    performanceCache[formatted.performance] = formatted;

    const artistName = seg.artistName;
    if (artistName) {
      if (!artistMap.has(artistName)) {
        artistMap.set(artistName, {
          name: artistName,
          rawArtist: artistName,
        });
        groupedByArtist[artistName] = [];
      }
      groupedByArtist[artistName].push(formatted);
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

  // 4. Render public ecosystem pages using pre-formatted segment groups and pre-stringified graph JSON
  const renderStart = performance.now();
  const pages = Object.values(groupedByArtist)
    .map((artistSegments) =>
      renderPublicEcosystem(artistSegments, graphDataJsonString),
    )
    .flat();
  console.log(
    `🎨 [Rebuild] Rendered ${pages.length} pages across ${Object.keys(groupedByArtist).length} artists in ${(performance.now() - renderStart).toFixed(2)}ms`,
  );
  const pagesKeys = pages.map((page) => page.key);
  // 5. Save generated HTML pages
  const saveStart = performance.now();
  await savePagesToTarget(env, pages);
  await purgeStalePages(pagesKeys, env.PAGE_CACHE, env.STATIC_BUCKET);
  console.log(
    `💾 [Rebuild] Saved ${pages.length} pages in ${(performance.now() - saveStart).toFixed(2)}ms`,
  );

  // 6. Complete total execution timing
  const totalTimeMs = (performance.now() - totalStart).toFixed(2);
  console.log(`✅ [Rebuild] Complete rebuild finished in ${totalTimeMs}ms`);

  return {
    pagesCount: pages.length,
    totalTimeMs,
  };
};
