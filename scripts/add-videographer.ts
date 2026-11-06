import {
  encryptVideographerConfig,
  type VideographerConfig,
} from "../src/server/crypto";

const MASTER_SECRET = process.env.MASTER_ENCRYPTION_KEY || "local-dev-secret";

const id = "v1";
const name = "splinermann";

const rawConfig: VideographerConfig = {
  storageKey:
    "55426f77becc7dc57e6eb61ffd69c8e78a9018974f819cfe1aff9e1e5bb35a8f",
  worker: "http://192.168.1.222:8787",
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
