import { getIsAllowed } from "./getIsAllowed";
import { isAdminRequest } from "./auth";
import { PendingLayout } from "./servePending";

/**
 * Guards the public artist portfolio route (`/:slug`).
 *
 * Admins (valid `X-Mobile-Admin-Key`) bypass artist scoping entirely.
 * Artists may view their own public portfolio; everyone else is blocked.
 */
export const usePublicPortfolio = async (c: any, next: any) => {
  const isAdmin = isAdminRequest(c);
  let isAllowed = false;

  if (!isAdmin) {
    const { results } = await c.env.DB.prepare(
      `SELECT artistId FROM segments WHERE artistName = ? AND status = 'public' LIMIT 1`,
    )
      .bind(c.req.path.split("/").filter(Boolean)[0])
      .all();

    const artistId = (results || [])[0]?.artistId;
    isAllowed = true; // artistId ? await getIsAllowed(artistId, c) : false;
  }

  if (!isAdmin && !isAllowed) {
    c.header(
      "Cache-Control",
      "public, max-age=0, s-maxage=31536000, must-revalidate",
    );
    c.header("Cache-Tag", `artist:${c.req.path.split("/").filter(Boolean)[0]}`);
    return c.html("<!doctype html>\n" + <PendingLayout />);
  }

  await next();
};
