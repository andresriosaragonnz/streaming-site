import { verifyAuthToken } from "./crypto";
import { parseCookies } from "./parseCookie";
import type { UserPayload } from "./types";

/**
 * Normalizes the `allowed` claim to a list of `${artistId}_${tokenVersion}`.
 *
 * Older tokens stored a bare artist ID plus a separate `v` field. Newer tokens
 * store fully qualified claims. Both forms are accepted here so existing
 * cookies keep working after the claim model was tightened.
 */
export function getAllowedClaims(
  payload: UserPayload | null | undefined,
): string[] {
  const raw: unknown = (payload as any)?.allowed;
  const version = (payload as any)?.v;
  const values = Array.isArray(raw)
    ? raw
    : typeof raw === "string"
      ? [raw]
      : [];

  return values
    .filter(
      (value): value is string => typeof value === "string" && value.length > 0,
    )
    .map((claim) => {
      if (claim.includes("_") || typeof version !== "number") return claim;
      return `${claim}_${version}`;
    });
}

/** Returns true when the payload grants access to the given artist version. */
export function hasArtistAccess(
  payload: UserPayload | null | undefined,
  artistId: string | null | undefined,
  tokenVersion: number | null | undefined,
): boolean {
  if (!payload || !artistId || !Number.isFinite(tokenVersion)) return false;
  return getAllowedClaims(payload).includes(`${artistId}_${tokenVersion}`);
}

/** Reads and verifies the artist auth cookie, including expiration. */
export async function getAuthPayload(c: any): Promise<UserPayload | null> {
  const cookies = parseCookies(c.req.header("Cookie"));
  const token = cookies["auth_token"];
  if (!token) return null;

  const secret = c.env?.AUTH_SECRET;
  if (typeof secret !== "string" || secret.length === 0) return null;

  const payload = await verifyAuthToken<UserPayload>(token, secret);
  if (!payload) return null;

  if (payload.exp && Date.now() / 1000 > payload.exp) return null;
  return payload;
}

/**
 * Constant-time comparison for short secrets. Avoids leaking the admin key
 * length or prefix through response timing.
 */
export function timingSafeStringEqual(a: string, b: string): boolean {
  if (!a || !b) return false;

  const aBytes = new TextEncoder().encode(a);
  const bBytes = new TextEncoder().encode(b);
  const length = Math.max(aBytes.length, bBytes.length);
  let diff = aBytes.length ^ bBytes.length;

  for (let i = 0; i < length; i++) {
    diff |= (aBytes[i] ?? 0) ^ (bBytes[i] ?? 0);
  }

  return diff === 0;
}

/** Admin requests must present the key in a header, never a query string. */
export function isAdminRequest(c: any): boolean {
  const provided = c.req.header("X-Mobile-Admin-Key");
  const secret = c.env?.MOBILE_ADMIN_SECRET;

  if (typeof provided !== "string" || typeof secret !== "string") {
    return false;
  }

  return timingSafeStringEqual(provided, secret);
}

/** Hono middleware guarding `/admin/*`, `/disable`, and `/enable`. */
export const useAdmin = async (c: any, next: any) => {
  if (!isAdminRequest(c)) {
    return c.text("Unauthorized", 401);
  }

  c.header("Cache-Control", "private, no-store");

  await next();
};
