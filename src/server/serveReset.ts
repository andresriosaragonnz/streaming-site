import { renderPublicEcosystem } from "../compiler/public/renderPublicEcosystem/renderPublicEcosystem";
import { savePagesToTarget } from "./savePagesToTarget";

export const serveReset = async (c: any) => {
  const sql = `SELECT * FROM segments`;
  const { results } = await c.env.DB.prepare(sql).all();
  const groupedByArtist = {} as any;
  for (const segment of results) {
    if (groupedByArtist[segment.artistName]) {
      groupedByArtist[segment.artistName].push(segment);
    } else {
      groupedByArtist[segment.artistName] = [segment];
    }
  }
  const pages = Object.values(groupedByArtist)
    .map(renderPublicEcosystem)
    .flat();

  // Write all generated pages to D1 `pages` table
  await savePagesToTarget(c.env, pages);

  return c.text("done");
};
