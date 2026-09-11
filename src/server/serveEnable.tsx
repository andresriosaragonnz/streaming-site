import { rebuildPages } from "./rebuildPages";

const Enable = ({ pagesCount, totalTimeMs }: any) => {
  return (
    <div>
      <h1>ENABLED</h1>
      <h2>{`done (${pagesCount} pages rebuilt in ${totalTimeMs}ms)`}</h2>
    </div>
  );
};

export const serveEnable = async (c: any) => {
  const sql = `UPDATE segments SET status = 'public'`;
  await c.env.DB.prepare(sql).all();
  const { pagesCount, totalTimeMs } = await rebuildPages(c.env);
  return c.html(
    "<!doctype html>\n" +
    <Enable totalTimeMs={totalTimeMs} pagesCount={pagesCount} />,
  );
};
