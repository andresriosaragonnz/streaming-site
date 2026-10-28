import { S3Client } from "@aws-sdk/client-s3";
import { decryptVideographerConfig } from "./crypto";

export const getS3ClientForVideographer = async (
  c: any,
  searchName: string,
) => {
  const v = await c.env.DB.prepare(
    `SELECT * FROM videographers WHERE LOWER(name) = LOWER(?)`,
  )
    .bind(searchName)
    .first();
  if (!v) throw new Error(`Videographer '${searchName}' not found`);

  // Decrypt all credentials in one step
  const config = await decryptVideographerConfig(
    v.encrypted_credentials,
    v.iv,
    c.env.MASTER_ENCRYPTION_KEY,
  );

  const client = new S3Client({
    region: "auto",
    endpoint: `https://${config.accountId}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: config.accessKeyId,
      secretAccessKey: config.secretAccessKey,
    },
  });

  return {
    s3: client,
    bucketName: config.bucketName,
  };
};
