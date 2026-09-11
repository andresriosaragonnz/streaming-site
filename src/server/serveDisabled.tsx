import { rebuildPages } from "./rebuildPages";

const Disable = ({ pagesCount, totalTimeMs }: any) => {
  return (
    <div>
      <h1>DISABLED</h1>
      <h2>{`done (${pagesCount} pages rebuilt in ${totalTimeMs}ms)`}</h2>
    </div>
  );
};

export const serveDisable = async (c: any) => {
  const sql = `UPDATE segments SET status = 'private'`;
  await c.env.DB.prepare(sql).all();
  const { pagesCount, totalTimeMs } = await rebuildPages(c.env);
  // return c.text(`done (${pagesCount} pages rebuilt in ${totalTimeMs}ms)`);
  return c.html(
    "<!doctype html>\n" +
    <Disable totalTimeMs={totalTimeMs} pagesCount={pagesCount} />,
  );
};
