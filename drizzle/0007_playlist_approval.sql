ALTER TABLE content_playlists ADD COLUMN approval_state TEXT NOT NULL DEFAULT 'draft';
ALTER TABLE content_playlists ADD COLUMN submitted_at TEXT;
ALTER TABLE content_playlists ADD COLUMN approved_at TEXT;
ALTER TABLE content_playlists ADD COLUMN rejected_at TEXT;

UPDATE content_playlists
SET approval_state = CASE
    WHEN status = 'ready' THEN 'approved'
    WHEN status = 'archived' THEN 'approved'
    ELSE 'draft'
END,
approved_at = CASE
    WHEN status IN ('ready', 'archived') THEN updated_at
    ELSE NULL
END;

CREATE INDEX IF NOT EXISTS content_playlists_vendor_approval_idx
ON content_playlists (vendor_id, approval_state, status);
