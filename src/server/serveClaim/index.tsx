import { createAuthToken, verifyAuthToken } from "../crypto";
import { parseCookies } from "../parseCookie";
import { ClaimPage } from "./Claim";

interface UserPayload {
  sub: string;
  allowed: string[];
  exp?: number;
}

export const serveClaim = async (c: any) => {
  const incomingToken = c.req.query("token");
  if (!incomingToken) return c.text("Missing token", 400);

  // 1. Verify incoming claim token
  const incomingPayload = await verifyAuthToken<UserPayload>(
    incomingToken,
    c.env.AUTH_SECRET,
  );
  if (!incomingPayload) return c.text("Invalid or tampered token", 403);

  // 2. Check if device already has an existing auth_token cookie
  const rawCookie = c.req.header("Cookie");
  const cookies = parseCookies(rawCookie);
  const existingToken = cookies["auth_token"];

  let mergedAllowed = incomingPayload.allowed;
  let subject = incomingPayload.sub;

  if (existingToken) {
    const existingPayload = await verifyAuthToken<UserPayload>(
      existingToken,
      c.env.AUTH_SECRET,
    );
    // Merge previous privileges with new privileges if existing token is valid
    if (existingPayload && Array.isArray(existingPayload.allowed)) {
      mergedAllowed = Array.from(
        new Set([...existingPayload.allowed, ...incomingPayload.allowed]),
      );
    }
  }

  // 3. Create a new JWT containing the combined permissions
  const combinedPayload: UserPayload = {
    sub: subject,
    allowed: mergedAllowed,
  };

  const updatedToken = await createAuthToken(
    combinedPayload,
    c.env.AUTH_SECRET,
  );

  // Detect HTTPS context to disable 'Secure' attribute during local HTTP dev
  const isSecure =
    c.req.url.startsWith("https://") ||
    c.req.header("x-forwarded-proto") === "https";

  const secureFlag = isSecure ? "; Secure" : "";

  // 4. Overwrite cookie with updated combined token (using Lax for top-level navigation support)
  c.header(
    "Set-Cookie",
    `auth_token=${updatedToken}; Path=/; HttpOnly${secureFlag}; SameSite=Lax; Max-Age=${60 * 60 * 24 * 365}`,
  );

  // 5. Render KitaJS component directly into Hono HTML response
  return c.html(<ClaimPage artists={mergedAllowed} />);
};
