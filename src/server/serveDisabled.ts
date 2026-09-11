import { rebuildPages } from "./rebuildPages";

export const serveDisable = async (c: any) => {
  const sql = `UPDATE segments SET status = 'private'`;
  await c.env.DB.prepare(sql).all();
  const { pagesCount, totalTimeMs } = await rebuildPages(c.env);
  return c.text(`done (${pagesCount} pages rebuilt in ${totalTimeMs}ms)`);
};
