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
  hash TEXT NOT NULL,
  performance TEXT NOT NULL,
  status TEXT DEFAULT 'private' CHECK(status IN ('public', 'private'))
);