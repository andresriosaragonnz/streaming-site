const Disable = () => {
  return (
    <div>
      <h1>DISABLED</h1>
    </div>
  );
};

export const serveDisable = async (c: any) => {
  await c.env.DB.prepare(`UPDATE segments SET status = 'private'`).run();
  c.header("Cache-Control", "no-store");
  return c.html("<!doctype html>\n" + <Disable />);
};
