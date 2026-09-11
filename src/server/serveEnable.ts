import { rebuildPages } from "./rebuildPages";

export const serveEnable = async (c: any) => {
  const sql = `UPDATE segments SET status = 'public'`;
  await c.env.DB.prepare(sql).all();
  const { pagesCount, totalTimeMs } = await rebuildPages(c.env);
  return c.text(`done (${pagesCount} pages rebuilt in ${totalTimeMs}ms)`);
};
