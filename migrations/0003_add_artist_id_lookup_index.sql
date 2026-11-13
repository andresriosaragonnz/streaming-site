-- Artist-scoped segment lookups by artistId.
-- Private dashboards and claim flows resolve segments directly by artistId;
-- the (artistName, status, artistId) composite index cannot serve a
-- leading-column-less artistId lookup, so a dedicated index is required.

CREATE INDEX IF NOT EXISTS idx_segments_artist_id
  ON segments (artistId);
