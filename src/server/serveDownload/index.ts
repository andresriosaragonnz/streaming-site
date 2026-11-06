import { createHmac } from "node:crypto";
import { parseCookies } from "../parseCookie";
import { verifyAuthToken } from "../crypto";
import type { UserPayload } from "../types";

export const serveDownload = async (c: any) => {
  const performance = c.req.param("slug");
  const cookies = parseCookies(c.req.header("Cookie"));
  const token = cookies["auth_token"];

  // 1. Validate authorization payload
  const payload = await verifyAuthToken<UserPayload>(token, c.env.AUTH_SECRET);
  if (!payload) return c.text("Unauthorized", 401);

  // 2. Fetch segment & videographer endpoint metadata from D1
  const segment = await c.env.DB.prepare(
    `SELECT s.*, v.media_endpoint 
     FROM segments s
     JOIN videographers v ON s.videographer_id = v.id
     WHERE s.performance = ?`,
  )
    .bind(performance)
    .first();

  if (!segment) {
    return c.text("Segment or master file not found", 404);
  }

  // 3. Verify artist access token version
  const currentArtist = await c.env.DB.prepare(
    `SELECT * FROM artists WHERE id = ?`,
  )
    .bind(segment.artistId)
    .first();

  const isAllowed = payload?.allowed.includes(
    `${currentArtist.id}_${currentArtist.token_version}`,
  );

  if (!isAllowed) {
    return c.text("Forbidden: Unauthorized access to master video", 403);
  }

  // 4. Generate 15-minute HMAC token for the master .mp4 download
  const objectPath = `${performance}.mp4`;
  const secret =
    c.env.PLATFORM_SECRET || process.env.PLATFORM_SECRET || "default-secret";
  const expires = Math.floor(Date.now() / 1000) + 900; // 15 minutes

  const signatureBase64 = createHmac("sha256", secret)
    .update(`${objectPath}:${expires}`)
    .digest("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");

  const hmacToken = `${expires}.${signatureBase64}`;

  // 5. Build download URL pointing to videographer worker proxy (with download=1 query flag)
  const downloadUrl = `${segment.media_endpoint}/${objectPath}?token=${hmacToken}&download=1`;

  // 6. Direct 302 redirect
  return c.redirect(downloadUrl, 302);
};
