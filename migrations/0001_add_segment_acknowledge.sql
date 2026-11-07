-- Adds the artist acknowledgement flag to segments.
-- SQLite has no native boolean type: 0 = not acknowledged, 1 = acknowledged.
ALTER TABLE segments
  ADD COLUMN acknowledge INTEGER NOT NULL DEFAULT 0
  CHECK (acknowledge IN (0, 1));
