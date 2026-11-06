export const serveEnable = async (c: any) => {
  const { results } = await c.env.DB.prepare(
    `SELECT duration, artistId, venueName FROM segments WHERE duration > 60`,
  ).all();

  let duration = 0;
  const artists: Record<string, true> = {};
  const venues: Record<string, true> = {};

  for (const segment of results as any[]) {
    duration += Number(segment.duration) || 0;
    artists[segment.artistId] = true;
    venues[segment.venueName] = true;
  }

  c.header("Cache-Control", "no-store");
  return c.json({
    songs: results?.length ?? 0,
    video_hours: duration / 3600,
    artists: Object.keys(artists).length,
    venues: Object.keys(venues).length,
  });
};
