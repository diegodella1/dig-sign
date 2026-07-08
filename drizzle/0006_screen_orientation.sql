ALTER TABLE screens ADD COLUMN orientation TEXT NOT NULL DEFAULT 'horizontal';
ALTER TABLE content_playlists ADD COLUMN orientation TEXT NOT NULL DEFAULT 'horizontal';

UPDATE screens
SET orientation = 'horizontal'
WHERE orientation IS NULL OR orientation NOT IN ('horizontal', 'vertical');

UPDATE content_playlists
SET orientation = 'horizontal'
WHERE orientation IS NULL OR orientation NOT IN ('horizontal', 'vertical');

CREATE INDEX IF NOT EXISTS screens_vendor_orientation_idx ON screens (vendor_id, orientation);
CREATE INDEX IF NOT EXISTS content_playlists_vendor_orientation_idx ON content_playlists (vendor_id, orientation);
