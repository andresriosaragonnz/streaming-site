// handleDownload.ts
import { GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { getS3ClientForVideographer } from "../s3Factory";
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

  // 2. Fetch segment & videographer metadata from D1
  const segment = await c.env.DB.prepare(
    `SELECT s.*, s.videographer as videographer_name
     FROM segments s
     WHERE s.performance = ?`,
  )
    .bind(performance)
    .first();
  console.log({ segment, performance });
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

  // 4. Instantiate S3 Client for the target videographer
  const { s3, bucketName } = await getS3ClientForVideographer(
    c,
    segment.videographer_name,
  );
  console.log({ s3, bucketName });
  // 5. Generate presigned download URL with forced attachment headers
  const command = new GetObjectCommand({
    Bucket: bucketName,
    Key: `${performance}.mp4`,
    ResponseContentDisposition: `attachment; filename="${performance}.mp4"`,
  });

  const signedUrl = await getSignedUrl(s3, command, { expiresIn: 900 });

  // 6. Return direct 302 redirect
  return c.redirect(signedUrl, 302);
};
