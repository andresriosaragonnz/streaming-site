import { ArchStagePage } from "./ArchStagePage";

export const serveTech = async (c: any) => {
  // 4. Render HTML
  return c.html("<!doctype html>\n" + <ArchStagePage />);
};
