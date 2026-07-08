-- Drop hour-based schedule tables (signage-only model).
PRAGMA foreign_keys = OFF;

DROP TABLE IF EXISTS scheduled_layers;
DROP TABLE IF EXISTS output_overrides;
DROP TABLE IF EXISTS operator_runbook_checks;
DROP TABLE IF EXISTS program_blocks;
DROP TABLE IF EXISTS program_days;
DROP TABLE IF EXISTS events;

DELETE FROM integration_settings WHERE provider = 'fallback_carousel';

PRAGMA foreign_keys = ON;
