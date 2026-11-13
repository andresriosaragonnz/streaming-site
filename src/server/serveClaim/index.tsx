import { createAuthToken, verifyAuthToken } from "../crypto";
import { getAllowedClaims } from "../auth";
import { parseCookies } from "../parseCookie";
import type { UserPayload } from "../types";
import { ClaimLayout } from "./ClaimLayout";
import { getVideographers } from "../getVideographers";
import { formatSegments } from "../../formatSegments";

interface ClaimPair {
  artistId: string;
  tokenVersion: number;
}

type ParseClaimsResult =
  | { ok: true; value: ClaimPair[] }
  | { ok: false; message: string };

/**
 * Parses normalized `${artistId}_${tokenVersion}` claims once so the handler
 * only deals with typed pairs. Malformed claims are rejected up front.
 */
const parseAllowedClaims = (allowed: string[]): ParseClaimsResult => {
  const pairs: ClaimPair[] = [];

  for (const claim of allowed) {
    const separator = claim.indexOf("_");
    if (separator === -1) {
      return { ok: false, message: "Invalid or tampered token" };
    }

    const artistId = claim.slice(0, separator);
    const tokenVersion = Number(claim.slice(separator + 1));

    if (!artistId || !Number.isFinite(tokenVersion)) {
      return { ok: false, message: "Invalid or tampered token" };
    }

    pairs.push({ artistId, tokenVersion });
  }

  return { ok: true, value: pairs };
};

export const serveClaim = async (c: any) => {
  c.header("Cache-Control", "private, no-store");

  try {
    const incomingToken = c.req.query("token");
    if (!incomingToken) return c.text("Missing token", 400);

    const incomingPayload = await verifyAuthToken<UserPayload>(
      incomingToken,
      c.env.AUTH_SECRET,
    );
    if (!incomingPayload) return c.text("Invalid or tampered token", 403);
    if (
      incomingPayload.exp &&
      Date.now() / 1000 > incomingPayload.exp
    ) {
      return c.text("Token expired", 403);
    }

    const incomingAllowed = getAllowedClaims(incomingPayload);
    if (incomingAllowed.length === 0) {
      return c.text("Invalid or tampered token", 403);
    }

    const parsedClaims = parseAllowedClaims(incomingAllowed);
    if (!parsedClaims.ok) {
      return c.text(parsedClaims.message, 403);
    }

    const incomingPairs = parsedClaims.value;
    const incomingArtistIds = Array.from(
      new Set(incomingPairs.map(({ artistId }) => artistId)),
    );

    // Reject revoked claims before rendering any private segment data.
    const incomingPlaceholders = incomingArtistIds.map(() => "?").join(", ");
    const { results: incomingArtists } = await c.env.DB.prepare(
      `SELECT id, token_version FROM artists WHERE id IN (${incomingPlaceholders})`,
    )
      .bind(...incomingArtistIds)
      .all();

    const currentVersions = new Map(
      ((incomingArtists || []) as Array<{
        id: string;
        token_version: number;
      }>).map((artist) => [artist.id, artist.token_version]),
    );

    const isRevoked = incomingPairs.some(
      ({ artistId, tokenVersion }) =>
        currentVersions.get(artistId) !== tokenVersion,
    );

    if (isRevoked) {
      return c.text("Token revoked", 403);
    }

    const cookies = parseCookies(c.req.header("Cookie"));
    const existingToken = cookies["auth_token"];

    let mergedAllowed = [...incomingAllowed];
    if (existingToken) {
      const existingPayload = await verifyAuthToken<UserPayload>(
        existingToken,
        c.env.AUTH_SECRET,
      );

      if (existingPayload) {
        const notExpired =
          !existingPayload.exp || Date.now() / 1000 <= existingPayload.exp;
        if (notExpired) {
          mergedAllowed = Array.from(
            new Set([...getAllowedClaims(existingPayload), ...incomingAllowed]),
          );
        }
      }
    }

    const combinedPayload: UserPayload = { allowed: mergedAllowed };
    const updatedToken = await createAuthToken(
      combinedPayload,
      c.env.AUTH_SECRET,
    );

    // Detect HTTPS context to disable 'Secure' during local HTTP dev.
    const isSecure =
      c.req.url.startsWith("https://") ||
      c.req.header("x-forwarded-proto") === "https";
    const secureFlag = isSecure ? "; Secure" : "";

    c.header(
      "Set-Cookie",
      `auth_token=${updatedToken}; Path=/; HttpOnly${secureFlag}; SameSite=Lax; Max-Age=${60 * 60 * 24 * 365}`,
    );

    const { results: segments } = await c.env.DB.prepare(
      `SELECT * FROM segments WHERE artistId = ?`,
    )
      .bind(incomingArtistIds[0])
      .all();

    const videographers = await getVideographers(c);
    const { formattedSegments, totalDuration } = formatSegments(
      segments,
      videographers,
    );

    const artistIds = Array.from(
      new Set(mergedAllowed.map((claim) => claim.split("_")[0])),
    );
    const placeholders = artistIds.map(() => "?").join(", ");
    const { results } = await c.env.DB.prepare(
      `SELECT DISTINCT artistName FROM segments WHERE artistId IN (${placeholders})`,
    )
      .bind(...artistIds)
      .all();

    const artistNames = results.map((row: any) => row.artistName);

    c.header("Cache-Control", "private, no-store");
    return c.html(
      "<!doctype html>\n" +
        (
          <ClaimLayout
            segments={segments}
            artists={artistNames}
            formattedSegments={formattedSegments}
            totalDuration={totalDuration}
          />
        ),
    );
  } catch (error) {
    console.error(
      "Claim failed:",
      error instanceof Error ? error.message : "unknown error",
    );
    return c.html("<!doctype html>\n" + <div>Error</div>, 500);
  }
};
