-- Composite indexes for public segment lookups.
-- Public pages and feeds filter segments by visibility status alongside the
-- lookup key, so composite indexes keep those paths off full table scans.

CREATE INDEX IF NOT EXISTS idx_segments_artist_status_id
  ON segments (artistName, status, artistId);

CREATE INDEX IF NOT EXISTS idx_segments_performance_status
  ON segments (performance, status);

CREATE INDEX IF NOT EXISTS idx_segments_status_artist_name
  ON segments (status, artistName);

CREATE INDEX IF NOT EXISTS idx_segments_status_id
  ON segments (status, id);
