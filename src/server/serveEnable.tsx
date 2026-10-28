const Enable = ({ pagesCount, totalTimeMs }: any) => {
  return (
    <div>
      <h1>ENABLED</h1>
    </div>
  );
};

export const serveEnable = async (c: any) => {
  const sql = `SELECT * FROM segments WHERE duration > 60`;
  const { results } = await c.env.DB.prepare(sql).all();
  console.log({ results });
  let duration = 0;
  const artists = {};
  const venues = {};

  for (const segment of results) {
    duration += segment.duration;
    artists[segment.artistId] = segment.artistId;
    venues[segment.venueName] = segment.venueName;
  }

  return c.json({
    songs: results?.length ?? 0,
    video_hours: duration / 3600,
    artists: Object.keys(artists).length,
    venues: Object.keys(venues).length,
  });
};
