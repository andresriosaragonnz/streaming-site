import { ArchStagePage } from "./ArchStagePage";

export const serveTech = async (c: any) => {
  // 4. Render HTML
  c.header(
    "Cache-Control",
    "public, max-age=0, s-maxage=31536000, must-revalidate",
  );
  c.header("Cache-Tag", "public-feed");
  return c.html("<!doctype html>\n" + <ArchStagePage />);
};
