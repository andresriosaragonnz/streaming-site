-- schema.sql
CREATE TABLE IF NOT EXISTS segments (
  id TEXT PRIMARY KEY,
  artistId TEXT NOT NULL,
  title TEXT NOT NULL,
  artistName TEXT NOT NULL,
  eventDate TEXT NOT NULL,
  venueName TEXT NOT NULL,
  "index" TEXT NOT NULL,
  startTime INTEGER NOT NULL,
  duration INTEGER NOT NULL,
  published_at INTEGER NOT NULL DEFAULT (0),
  updated_at INTEGER NOT NULL DEFAULT (unixepoch()),
  hash TEXT NOT NULL,
  videographer TEXT NOT NULL DEFAULT 'splinermann',
  performance TEXT NOT NULL,
  masterDuration TEXT NOT NULL,
  masterSize TEXT NOT NULL,
  status TEXT DEFAULT 'private' CHECK(status IN ('public', 'private'))
);

CREATE TABLE IF NOT EXISTS artists (
  id TEXT PRIMARY KEY,
  token_version INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS videographers (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  encrypted_credentials TEXT NOT NULL,
  iv TEXT NOT NULL,
  created_at INTEGER DEFAULT (unixepoch())
);

CREATE TABLE IF NOT EXISTS tk (
  id TEXT PRIMARY KEY
);


INSERT INTO videographers (id, name, encrypted_credentials, iv)VALUES ('v1','splinnermann','/3dPxeTWZO2rH8huCQx6wuOuh8kMFiflK/utkw0dLBHP3jtSYVIPXWUEpJfNmw0YdCtACrRlpM9ta8aszMPvlWEykgO9NKMKE6FopJB99atoUEH7hgQ9pI9JfN8CJu5H5NMgur4XYT+C7pVIcLKe0ncp6u00NLYvaobwW7khNHVIKHc6DA5a57n8a3wEAzulue1PD5ywQh5GTgxilC+fxGnOuX46W2BflZy6g5O+77Clrs+vmBmTpkQsKU1HzMB7NMUvS5DooNCslBzbx1KpGRjPD6EfeLzWHAibZu4ZZ6sQEA==','C0fNjLHPRTqYSEIo');
