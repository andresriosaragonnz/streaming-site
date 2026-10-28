import { ArchStagePage } from "./ArchStagePage";
import { getIsAllowed } from "../getIsAllowed";

export const serveTech = async (c: any) => {
  // 4. Render HTML
  return c.html("<!doctype html>\n" + <ArchStagePage />);
};
