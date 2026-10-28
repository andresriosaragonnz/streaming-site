import {
  encryptVideographerConfig,
  type VideographerConfig,
} from "../src/server/crypto";

const MASTER_SECRET = process.env.MASTER_ENCRYPTION_KEY || "local-dev-secret";

const id = "v1";
const name = "splinnermann";

const rawConfig: VideographerConfig = {
  accountId: "4f88d857d7e2ff5668d29087437da4f9",
  accessKeyId: "2eb0334d5a5711b96d1c79b7a15e9a11",
  secretAccessKey:
    "5efbcf51836ce98fae420f832890774171005b7af95ab9b4770efab1481f4ec6",
  bucketName: "performances",
};

const { encryptedCredentials, iv } = await encryptVideographerConfig(
  rawConfig,
  MASTER_SECRET,
);

console.log(`
INSERT INTO videographers (id, name, encrypted_credentials, iv)
VALUES (
  '${id}',
  '${name}',
  '${encryptedCredentials}',
  '${iv}'
);
`);
// bun run scripts/add-videographer.ts | npx wrangler d1 execute iknowthatband-db --remote --file=-
