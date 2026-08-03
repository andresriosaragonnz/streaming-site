import fs from "node:fs";
import path from "node:path";

// 1. Read and parse data.json
const jsonPath = path.resolve("data.json");
const rawData = JSON.parse(fs.readFileSync(jsonPath, "utf-8"));

function generateNetworkData(segments) {
  // Deduplicate unique performances and extract distinct artists
  const performances = new Map();
  const artists = new Set();

  // Standardize input format whether JSON root is an Array or Object
  const segmentList = Array.isArray(segments)
    ? segments
    : Object.values(segments);

  segmentList.forEach((seg) => {
    if (!seg.artistName || !seg.performance) return;

    // Standardize artist identifier
    const artistKey = seg.artistName;
    artists.add(artistKey);

    // Group segments by performance string or unique event key
    const eventKey = `${seg.venueName}_${seg.eventDate}`;

    if (!performances.has(eventKey)) {
      performances.set(eventKey, {
        venue: seg.venueName,
        date: seg.eventDate,
        artists: new Set(),
      });
    }

    performances.get(eventKey).artists.add(artistKey);
  });

  // 2. Generate Nodes with Deterministic ID Assignment
  const artistArray = Array.from(artists).sort();
  const artistIdMap = new Map();

  const nodes = artistArray.map((artist, index) => {
    const id = String(index + 1);
    artistIdMap.set(artist, id);
    return {
      id: id,
      name: artist.replace(/_/g, " "),
      rawArtist: artist,
    };
  });

  // 3. Compute Co-Performance Weighted Edges across unique shows
  const edgePairs = new Map();

  performances.forEach((eventData) => {
    const eventArtists = Array.from(eventData.artists);

    for (let i = 0; i < eventArtists.length; i++) {
      for (let j = i + 1; j < eventArtists.length; j++) {
        const id1 = artistIdMap.get(eventArtists[i]);
        const id2 = artistIdMap.get(eventArtists[j]);

        // Standardize pair key order regardless of array index
        const pairKey =
          Number(id1) < Number(id2) ? `${id1}-${id2}` : `${id2}-${id1}`;

        if (!edgePairs.has(pairKey)) {
          const [source, target] = pairKey.split("-");
          edgePairs.set(pairKey, { source, target, weight: 1 });
        } else {
          edgePairs.get(pairKey).weight += 1;
        }
      }
    }
  });

  const edges = Array.from(edgePairs.values()).map((edge, index) => ({
    id: `e-${index}`,
    start: edge.source,
    end: edge.target,
    source: edge.source,
    target: edge.target,
    weight: edge.weight,
  }));

  return { nodes, edges };
}

// Execute and export static JSON asset
function build() {
  const outputDir = path.resolve("public/data");
  const outputFile = path.join(outputDir, "network.json");

  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const networkData = generateNetworkData(rawData);
  fs.writeFileSync(outputFile, JSON.stringify(networkData, null, 2), "utf-8");

  console.log(`✅ Network JSON exported to ${outputFile}`);
  console.log(
    `📊 Stats: ${networkData.nodes.length} unique artist nodes, ${networkData.edges.length} co-performance edges.`,
  );
}

build();
