import { Favicon } from "../../components/Favicon";

const EMPTY_GRAPH_DATA =
  '{"nodes":[],"edges":[],"artistClusters":{},"artistLookup":{}}';

export interface StatusPageProps {
  graphDataJS: string;
}

/**
 * Public status page: a single heading and the full artist network.
 * No navigation, no drawer, no preselected artist.
 */
export const StatusPage = ({ graphDataJS }: StatusPageProps) => (
  <html lang="en">
    <head>
      <title>Status</title>
      <Favicon />

      <link rel="stylesheet" href="/css/status.css" />
    </head>
    <body>
      <main class="status-page">
        <h1>Status</h1>
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
  const graphData = await c.env.PAGE_CACHE.get("graphDataJsonString");

  c.header(
    "Cache-Control",
    "public, max-age=60, s-maxage=300, stale-while-revalidate=86400",
  );

  return c.html(
    "<!doctype html>\n" +
      <StatusPage graphDataJS={graphData || EMPTY_GRAPH_DATA} />,
  );
};
