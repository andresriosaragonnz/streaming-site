export const serveOptions = async (c: any) => {
  const sql = `SELECT DISTINCT artistName FROM segments WHERE status = 'public' ORDER BY artistName ASC;`;

  // 5. Query D1 with bound IDs
  const { results } = await c.env.DB.prepare(sql).all();

  const artistNames = results.map((row: any) => row.artistName);
  c.header(
    "Cache-Control",
    "public, max-age=0, s-maxage=31536000, must-revalidate",
  );
  c.header("Cache-Tag", "public-feed");
  return c.json(artistNames);
};