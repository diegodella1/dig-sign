CREATE TABLE IF NOT EXISTS vendors (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    slug TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'active',
    created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
    updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);

CREATE UNIQUE INDEX IF NOT EXISTS vendors_slug_unique ON vendors (slug);
CREATE INDEX IF NOT EXISTS vendors_status_idx ON vendors (status);

INSERT OR IGNORE INTO vendors (id, name, slug, status)
VALUES ('default', 'Default Vendor', 'default', 'active');

ALTER TABLE admin_operators ADD COLUMN vendor_id TEXT REFERENCES vendors(id) ON DELETE SET NULL;
ALTER TABLE audit_log ADD COLUMN vendor_id TEXT REFERENCES vendors(id) ON DELETE SET NULL;
ALTER TABLE media_assets ADD COLUMN vendor_id TEXT NOT NULL DEFAULT 'default' REFERENCES vendors(id) ON DELETE CASCADE;
ALTER TABLE slide_assets ADD COLUMN vendor_id TEXT NOT NULL DEFAULT 'default' REFERENCES vendors(id) ON DELETE CASCADE;
ALTER TABLE music_playlists ADD COLUMN vendor_id TEXT NOT NULL DEFAULT 'default' REFERENCES vendors(id) ON DELETE CASCADE;
ALTER TABLE layout_presets ADD COLUMN vendor_id TEXT NOT NULL DEFAULT 'default' REFERENCES vendors(id) ON DELETE CASCADE;
ALTER TABLE screens ADD COLUMN vendor_id TEXT NOT NULL DEFAULT 'default' REFERENCES vendors(id) ON DELETE CASCADE;
ALTER TABLE content_playlists ADD COLUMN vendor_id TEXT NOT NULL DEFAULT 'default' REFERENCES vendors(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS media_assets_vendor_idx ON media_assets (vendor_id, updated_at);
CREATE INDEX IF NOT EXISTS slide_assets_vendor_idx ON slide_assets (vendor_id, updated_at);
CREATE INDEX IF NOT EXISTS music_playlists_vendor_idx ON music_playlists (vendor_id, name);
CREATE INDEX IF NOT EXISTS layout_presets_vendor_idx ON layout_presets (vendor_id, name);
CREATE INDEX IF NOT EXISTS screens_vendor_idx ON screens (vendor_id, name);
CREATE INDEX IF NOT EXISTS content_playlists_vendor_idx ON content_playlists (vendor_id, name);
CREATE INDEX IF NOT EXISTS admin_operators_vendor_idx ON admin_operators (vendor_id, handle);
CREATE INDEX IF NOT EXISTS audit_log_vendor_idx ON audit_log (vendor_id, created_at);

UPDATE integration_settings
SET provider = 'music_output:default'
WHERE provider = 'music_output'
  AND NOT EXISTS (
    SELECT 1
    FROM integration_settings existing
    WHERE existing.provider = 'music_output:default'
  );
