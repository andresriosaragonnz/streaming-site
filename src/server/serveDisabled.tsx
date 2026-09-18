const Disable = () => {
  return (
    <div>
      <h1>DISABLED</h1>
    </div>
  );
};

export const serveDisable = async (c: any) => {
  const sql = `UPDATE segments SET status = 'private'`;
  await c.env.DB.prepare(sql).all();
  return c.html("<!doctype html>\n" + <Disable />);
};
