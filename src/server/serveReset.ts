import { buildPublicNetworkGraph } from "./calculateNetwork";
import { renderPublicEcosystem } from "./publicEcosystem/renderPublicEcosystem";
import { savePagesToTarget } from "./savePagesToTarget";

export const serveReset = async (c: any) => {
  // 1. Fetch all segments
  const sql = `SELECT * FROM segments`;
  const { results: allSegments } = await c.env.DB.prepare(sql).all();

  // 2. Extract unique nodes/artists across the full dataset
  const artistMap = new Map<string, { name: string; rawArtist: string }>();

  for (const seg of allSegments) {
    if (seg.artistName && !artistMap.has(seg.artistName)) {
      artistMap.set(seg.artistName, {
        name: seg.artistName,
        rawArtist: seg.artistName,
      });
    }
  }

  const rawNodes = Array.from(artistMap.values());

  // 3. Build the full public network graph in-memory
  const graphDataJS = buildPublicNetworkGraph(allSegments, rawNodes);

  // 4. Group segments by artistName
  const groupedByArtist: Record<string, any[]> = {};
  for (const segment of allSegments) {
    if (!groupedByArtist[segment.artistName]) {
      groupedByArtist[segment.artistName] = [];
    }
    groupedByArtist[segment.artistName].push(segment);
  }

  // 5. Render public ecosystem pages passing graphDataJS to each
  const pages = Object.values(groupedByArtist)
    .map((artistSegments) => renderPublicEcosystem(artistSegments, graphDataJS))
    .flat();

  // 6. Save generated HTML pages to D1 target table
  await savePagesToTarget(c.env, pages);

  return c.text("done");
};
