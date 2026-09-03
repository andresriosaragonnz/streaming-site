import { rebuildPages } from "./rebuildPages";

export const serveReset = async (c: any) => {
  const { pagesCount, totalTimeMs } = await rebuildPages(c.env);
  return c.text(`done (${pagesCount} pages rebuilt in ${totalTimeMs}ms)`);
};
