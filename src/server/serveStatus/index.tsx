import { Favicon } from "../../components/Favicon";
import { buildPublicNetworkGraph } from "../calculateNetwork";

const EMPTY_GRAPH_DATA =
  '{"nodes":[],"edges":[],"artistClusters":{},"artistLookup":{}}';

export interface StatusStats {
  totalPerformances: number;
  acknowledgedPerformances: number;
  acknowledgeRate: number;
}

export interface StatusPageProps {
  graphDataJS: string;
  stats: StatusStats;
}

/**
 * Public status page: status heading, acknowledgement stats and full artist network.
 * No navigation, no drawer, no preselected artist.
 */
export const StatusPage = ({ graphDataJS, stats }: StatusPageProps) => (
  <html lang="en">
    <head>
      <title>Status</title>
      <Favicon />

      <link rel="stylesheet" href="/css/status.css" />
    </head>
    <body>
      <main class="status-page">
        <h1>Status</h1>
        <div class="grid-summary">
          <div class="card">
            <div class="card-title">Total Performances</div>
            <div class="card-val">{stats.totalPerformances}</div>
          </div>
          <div class="card">
            <div class="card-title">Acknowledged</div>
            <div class="card-val text-ok">{stats.acknowledgedPerformances}</div>
          </div>
          <div class="card">
            <div class="card-title">Acknowledge Rate</div>
            <div class="card-val">{stats.acknowledgeRate.toFixed(1)}%</div>
          </div>
        </div>
        <section id="status-graph" class="status-graph-panel">
          <div id="graph"></div>
        </section>
      </main>

      <script>{`window.__GRAPH_DATA__ = ${graphDataJS};`}</script>
      <script type="module" src="/js/network.js"></script>
    </body>
  </html>
);

export const serveStatus = async (c: any) => {
  const statsResult = await c.env.DB.prepare(
    `SELECT
       COUNT(DISTINCT performance) AS totalPerformances,
       COUNT(DISTINCT CASE WHEN acknowledge = 1 THEN performance END) AS acknowledgedPerformances
     FROM segments`,
  ).all();

  const statsRow = statsResult?.results?.[0] ?? {};
  const stats: StatusStats = {
    totalPerformances: statsRow?.totalPerformances ?? 0,
    acknowledgedPerformances: statsRow?.acknowledgedPerformances ?? 0,
    acknowledgeRate: 0,
  };
  stats.acknowledgeRate =
    stats.totalPerformances > 0
      ? (stats.acknowledgedPerformances / stats.totalPerformances) * 100
      : 0;

  // Recalculate the public network graph from source segments (same as rebuildPages).
  const graphResult = await c.env.DB.prepare(
    `SELECT * FROM segments WHERE status = 'public'`,
  ).all();
  const allSegments = graphResult?.results ?? [];

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
  const graphDataJS = buildPublicNetworkGraph(formattedSegments, rawNodes);
  const graphDataJsonString = JSON.stringify(graphDataJS);

  // Reset the graph cache once the status page has (re)calculated the graph.
  await c.env.PAGE_CACHE.delete("graphDataJsonString");

  c.header(
    "Cache-Control",
    "public, max-age=60, s-maxage=300, stale-while-revalidate=86400",
  );

  return c.html(
    "<!doctype html>\n" +
      <StatusPage graphDataJS={graphDataJsonString || EMPTY_GRAPH_DATA} stats={stats} />,
  );
};
