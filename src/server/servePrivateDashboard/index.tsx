import { hashNameToId } from "../../utils/makeId";
import { PrivateDashboardLayout } from "./PrivateDashboardLayout";
import { getVideographers } from "../getVideographers";

import { formatSegments } from "../../formatSegments";

export const servePrivateDashboard = async (c: any) => {
  const slug = c.req.param("slug");
  const id = hashNameToId(slug);

  const sql = `SELECT * FROM segments WHERE artistId = ?`;
  const videographers = await getVideographers(c);
  const { results } = await c.env.DB.prepare(sql).bind(id).all();
  const { formattedSegments, totalDuration } = formatSegments(
    results,
    videographers,
  );
  return c.html(
    "<!doctype html>\n" +
    <PrivateDashboardLayout formattedSegments={formattedSegments} />,
  );
};
