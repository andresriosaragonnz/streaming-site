import { getHeroImage } from "../compiler/formatSegments/getHeroImage.js";
const countByArtist = (segments: any) => {
  const artists = {} as any;
  for (const segment of segments) {
    if (artists[segment.artistId]) {
      artists[segment.artistId].count++;
    } else {
      artists[segment.artistId] = {
        count: 1,
        image: `${getHeroImage(segment.id)}_card`,
        artistName: segment.artistName.replaceAll("_", " "),
      };
    }
  }
  return Object.values(artists);
};

export const serveFeed = async (c: any) => {
  try {
    const body = await c.req.json();
    const artistIds = body.artistIds;

    if (artistIds.length === 0) {
      return c.text("Invalid playlist IDs", 400);
    }

    const now = Math.floor(Date.now() / 1000);
    const THIRTY_DAYS_SEC = 2592000;

    // 4. Construct SQL statement with placeholders for dynamic IN clause
    const placeholders = artistIds.map(() => "?").join(", ");
    const sql = `
        SELECT * FROM segments 
        WHERE artistId IN (${placeholders})
            AND status = 'public' 
            AND published_at IS NOT NULL
            AND (? - published_at) <= ?
        ORDER BY published_at DESC
        `;

    // 5. Query D1 with bound IDs PLUS current timestamp and 30-day threshold
    const { results } = await c.env.DB.prepare(sql)
      .bind(...artistIds, now, THIRTY_DAYS_SEC) // <-- Add now and THIRTY_DAYS_SEC here
      .all();
    return c.json({ updates: countByArtist(results) });
  } catch (err) {
    console.error("Failed to parse playlist share parameter:", err);
    return c.text("Invalid share payload", 400);
  }
};
2592000;
1786278398;
1786275784;
