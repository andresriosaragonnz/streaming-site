const Enable = ({ pagesCount, totalTimeMs }: any) => {
  return (
    <div>
      <h1>ENABLED</h1>
    </div>
  );
};

export const serveEnable = async (c: any) => {
  const sql = `UPDATE segments SET status = 'public'`;
  await c.env.DB.prepare(sql).all();
  return c.html("<!doctype html>\n" + <Enable />);
};
