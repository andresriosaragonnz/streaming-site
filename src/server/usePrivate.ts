import { verifyAuthToken } from "./crypto";
import { parseCookies } from "./parseCookie";
import type { UserPayload } from "./types";

export const usePrivate = async (c: any, next: any) => {
  console.log("here");
  const cookies = parseCookies(c.req.header("Cookie"));
  const token = cookies["auth_token"];
  if (!token) {
    return c.text("403 Forbidden: Missing authentication cookie", 403);
  }

  const payload = await verifyAuthToken<UserPayload>(token, c.env.AUTH_SECRET);
  if (!payload) {
    return c.text("403 Forbidden: Invalid token", 403);
  }

  // Check Expiration if defined
  if (payload.exp && Date.now() / 1000 > payload.exp) {
    return c.text("403 Forbidden: Token expired", 403);
  }

  const requestedGroup = c.req.param("slug"); // e.g. "queen" from /private/queen/...
  // Check if requested group is in user's privilege list
  if (!payload.allowed.includes(requestedGroup)) {
    return c.text(
      `403 Forbidden: You do not have access to ${requestedGroup}`,
      403,
    );
  }
  console.log("here");
  await next();
};
