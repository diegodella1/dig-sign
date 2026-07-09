/**
 * Drizzle ORM schema for Cloudflare D1 (SQLite).
 *
 * Ported from rtvplanner-supabase-install.sql.
 * Postgres-to-SQLite mapping notes:
 *   uuid          → text  (IDs generated via crypto.randomUUID() in app)
 *   timestamptz   → text  (ISO 8601 strings)
 *   jsonb         → text  mode:'json'
 *   boolean       → integer  mode:'boolean'
 *   text[] arrays → text  mode:'json'  (stored as JSON array)
 *   date          → text  (YYYY-MM-DD string)
 *   time          → text  (HH:MM:SS string)
 *   numeric       → real
 *   integer       → integer
 *   Postgres ENUMs → plain text columns (SQLite has no native ENUM type)
 *   RLS / triggers / functions → dropped (handled at app layer)
 *
 * The unique partial index on output_overrides(program_day_id) WHERE enabled=1
 * was removed in migration 0004_drop_schedule.sql.
 */

import { sql } from 'drizzle-orm';
import {
    sqliteTable,
    text,
    integer,
    uniqueIndex,
    index,
    primaryKey,
} from 'drizzle-orm/sqlite-core';

// ─── integration_settings ────────────────────────────────────────────────────
// PK is `provider` text (not uuid) — kept as-is from the SQL schema.

export const vendors = sqliteTable(
    'vendors',
    {
        id: text('id')
            .primaryKey()
            .$defaultFn(() => crypto.randomUUID()),
        name: text('name').notNull(),
        slug: text('slug').notNull(),
        status: text('status').notNull().default('active'),
        createdAt: text('created_at')
            .notNull()
            .$defaultFn(() => new Date().toISOString()),
        updatedAt: text('updated_at')
            .notNull()
            .$defaultFn(() => new Date().toISOString()),
    },
    (table) => ({
        slugUnique: uniqueIndex('vendors_slug_unique').on(table.slug),
        statusIdx: index('vendors_status_idx').on(table.status),
    }),
);

export type VendorRow = typeof vendors.$inferSelect;
export type InsertVendorRow = typeof vendors.$inferInsert;

export const integrationSettings = sqliteTable('integration_settings', {
    provider: text('provider').primaryKey(),
    publicConfig: text('public_config', { mode: 'json' })
        .notNull()
        .$defaultFn(() => ({})),
    encryptedSecret: text('encrypted_secret'),
    status: text('status').notNull().default('unknown'),
    lastCheckedAt: text('last_checked_at'),
    lastError: text('last_error'),
    createdAt: text('created_at')
        .notNull()
        .$defaultFn(() => new Date().toISOString()),
    updatedAt: text('updated_at')
        .notNull()
        .$defaultFn(() => new Date().toISOString()),
});

export type IntegrationSettingsRow = typeof integrationSettings.$inferSelect;
export type InsertIntegrationSettingsRow = typeof integrationSettings.$inferInsert;

// ─── media_assets ────────────────────────────────────────────────────────────
// source_type enum → text; media_kind enum → text; asset_status enum → text.
// playback_readiness_status CHECK → enforced in app layer.
// lifecycle_state CHECK → enforced in app layer.

export const mediaAssets = sqliteTable('media_assets', {
    id: text('id')
        .primaryKey()
        .$defaultFn(() => crypto.randomUUID()),
    vendorId: text('vendor_id')
        .notNull()
        .default('default')
        .references(() => vendors.id, { onDelete: 'cascade' }),
    title: text('title').notNull(),
    description: text('description'),
    sourceType: text('source_type').notNull(),
    mediaKind: text('media_kind').notNull(),
    assetType: text('asset_type').notNull(),
    url: text('url'),
    storageBucket: text('storage_bucket'),
    storagePath: text('storage_path'),
    thumbnailUrl: text('thumbnail_url'),
    durationSeconds: integer('duration_seconds'),
    status: text('status').notNull().default('draft'),
    vimeoId: text('vimeo_id').unique(),
    vimeoUri: text('vimeo_uri'),
    vimeoPrivacy: text('vimeo_privacy'),
    vimeoEmbedStatus: text('vimeo_embed_status'),
    metadata: text('metadata', { mode: 'json' })
        .notNull()
        .$defaultFn(() => ({})),
    playbackReadinessStatus: text('playback_readiness_status').notNull().default('unchecked'),
    playbackCheckedAt: text('playback_checked_at'),
    playbackError: text('playback_error'),
    lifecycleState: text('lifecycle_state').notNull().default('reviewed'),
    createdAt: text('created_at')
        .notNull()
        .$defaultFn(() => new Date().toISOString()),
    updatedAt: text('updated_at')
        .notNull()
        .$defaultFn(() => new Date().toISOString()),
});

export type MediaAssetRow = typeof mediaAssets.$inferSelect;
export type InsertMediaAssetRow = typeof mediaAssets.$inferInsert;

// ─── slide_assets ────────────────────────────────────────────────────────────
// slide_type CHECK → enforced in app layer.
// status CHECK → enforced in app layer.

export const slideAssets = sqliteTable('slide_assets', {
    id: text('id')
        .primaryKey()
        .$defaultFn(() => crypto.randomUUID()),
    vendorId: text('vendor_id')
        .notNull()
        .default('default')
        .references(() => vendors.id, { onDelete: 'cascade' }),
    title: text('title').notNull(),
    slideType: text('slide_type').notNull(),
    content: text('content'),
    imageUrl: text('image_url'),
    htmlContent: text('html_content'),
    templateId: text('template_id'),
    defaultDurationSeconds: integer('default_duration_seconds'),
    status: text('status').notNull().default('draft'),
    metadata: text('metadata', { mode: 'json' })
        .notNull()
        .$defaultFn(() => ({})),
    createdAt: text('created_at')
        .notNull()
        .$defaultFn(() => new Date().toISOString()),
    updatedAt: text('updated_at')
        .notNull()
        .$defaultFn(() => new Date().toISOString()),
});

export type SlideAssetRow = typeof slideAssets.$inferSelect;
export type InsertSlideAssetRow = typeof slideAssets.$inferInsert;

// ─── audit_log ───────────────────────────────────────────────────────────────

export const auditLog = sqliteTable('audit_log', {
    id: text('id')
        .primaryKey()
        .$defaultFn(() => crypto.randomUUID()),
    actor: text('actor').notNull().default('system'),
    action: text('action').notNull(),
    entityType: text('entity_type').notNull(),
    entityId: text('entity_id'),
    vendorId: text('vendor_id').references(() => vendors.id, { onDelete: 'set null' }),
    metadata: text('metadata', { mode: 'json' })
        .notNull()
        .$defaultFn(() => ({})),
    createdAt: text('created_at')
        .notNull()
        .$defaultFn(() => new Date().toISOString()),
});

export type AuditLogRow = typeof auditLog.$inferSelect;
export type InsertAuditLogRow = typeof auditLog.$inferInsert;

// ─── admin_operators ─────────────────────────────────────────────────────────
// role CHECK → enforced in app layer.
// status CHECK → enforced in app layer.

export const adminOperators = sqliteTable('admin_operators', {
    id: text('id')
        .primaryKey()
        .$defaultFn(() => crypto.randomUUID()),
    handle: text('handle').notNull().unique(),
    vendorId: text('vendor_id').references(() => vendors.id, { onDelete: 'set null' }),
    displayName: text('display_name').notNull(),
    role: text('role').notNull(),
    tokenHash: text('token_hash').notNull(),
    status: text('status').notNull().default('active'),
    createdAt: text('created_at')
        .notNull()
        .$defaultFn(() => new Date().toISOString()),
    updatedAt: text('updated_at')
        .notNull()
        .$defaultFn(() => new Date().toISOString()),
});

export type AdminOperatorRow = typeof adminOperators.$inferSelect;
export type InsertAdminOperatorRow = typeof adminOperators.$inferInsert;

// ─── admin_sessions ──────────────────────────────────────────────────────────
// expires_at / revoked_at → text (ISO strings).

export const adminSessions = sqliteTable(
    'admin_sessions',
    {
        id: text('id')
            .primaryKey()
            .$defaultFn(() => crypto.randomUUID()),
        operatorId: text('operator_id')
            .notNull()
            .references(() => adminOperators.id, { onDelete: 'cascade' }),
        sessionHash: text('session_hash').notNull().unique(),
        expiresAt: text('expires_at').notNull(),
        revokedAt: text('revoked_at'),
        createdAt: text('created_at')
            .notNull()
            .$defaultFn(() => new Date().toISOString()),
    },
    (table) => ({
        // mirrors: idx_admin_sessions_operator
        operatorExpiresIdx: index('idx_admin_sessions_operator').on(
            table.operatorId,
            table.expiresAt,
        ),
    }),
);

export type AdminSessionRow = typeof adminSessions.$inferSelect;
export type InsertAdminSessionRow = typeof adminSessions.$inferInsert;

// ─── api_rate_limits ─────────────────────────────────────────────────────────
// PK is bucket_key text.
// reset_at → text (ISO string).
// hits → integer.

export const apiRateLimits = sqliteTable('api_rate_limits', {
    bucketKey: text('bucket_key').primaryKey(),
    hits: integer('hits').notNull().default(0),
    resetAt: text('reset_at').notNull(),
    updatedAt: text('updated_at')
        .notNull()
        .$defaultFn(() => new Date().toISOString()),
});

export type ApiRateLimitRow = typeof apiRateLimits.$inferSelect;
export type InsertApiRateLimitRow = typeof apiRateLimits.$inferInsert;

// ─── operator_preferences ────────────────────────────────────────────────────
// Composite PK (operator_id, key) — expressed via .primaryKey() on each col
// is not supported for composite PKs in this style; use the table-level
// primaryKey option instead via sql``. Drizzle sqlite-core supports
// primaryKey({ columns }) in the third argument.

export const operatorPreferences = sqliteTable(
    'operator_preferences',
    {
        operatorId: text('operator_id')
            .notNull()
            .references(() => adminOperators.id, { onDelete: 'cascade' }),
        key: text('key').notNull(),
        value: text('value', { mode: 'json' })
            .notNull()
            .$defaultFn(() => ({})),
        updatedAt: text('updated_at')
            .notNull()
            .$defaultFn(() => new Date().toISOString()),
    },
    (table) => ({
        pk: primaryKey({ columns: [table.operatorId, table.key] }),
    }),
);

export type OperatorPreferenceRow = typeof operatorPreferences.$inferSelect;
export type InsertOperatorPreferenceRow = typeof operatorPreferences.$inferInsert;

// ─── music_playlists ─────────────────────────────────────────────────────────
// status CHECK → enforced in app layer (draft | ready | archived).

export const musicPlaylists = sqliteTable('music_playlists', {
    id: text('id')
        .primaryKey()
        .$defaultFn(() => crypto.randomUUID()),
    vendorId: text('vendor_id')
        .notNull()
        .default('default')
        .references(() => vendors.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    status: text('status').notNull().default('draft'),
    createdAt: text('created_at')
        .notNull()
        .$defaultFn(() => new Date().toISOString()),
    updatedAt: text('updated_at')
        .notNull()
        .$defaultFn(() => new Date().toISOString()),
});

export type MusicPlaylistRow = typeof musicPlaylists.$inferSelect;
export type InsertMusicPlaylistRow = typeof musicPlaylists.$inferInsert;

// ─── music_playlist_items ────────────────────────────────────────────────────

export const musicPlaylistItems = sqliteTable(
    'music_playlist_items',
    {
        id: text('id')
            .primaryKey()
            .$defaultFn(() => crypto.randomUUID()),
        playlistId: text('playlist_id')
            .notNull()
            .references(() => musicPlaylists.id, { onDelete: 'cascade' }),
        assetId: text('asset_id')
            .notNull()
            .references(() => mediaAssets.id, { onDelete: 'cascade' }),
        sortOrder: integer('sort_order').notNull(),
        createdAt: text('created_at')
            .notNull()
            .$defaultFn(() => new Date().toISOString()),
    },
    (table) => ({
        playlistAssetUnique: uniqueIndex('music_playlist_items_playlist_asset_unique').on(
            table.playlistId,
            table.assetId,
        ),
        playlistOrderIdx: index('music_playlist_items_playlist_order_idx').on(
            table.playlistId,
            table.sortOrder,
        ),
    }),
);

export type MusicPlaylistItemRow = typeof musicPlaylistItems.$inferSelect;
export type InsertMusicPlaylistItemRow = typeof musicPlaylistItems.$inferInsert;

// ─── layout_presets ───────────────────────────────────────────────────────────

export const layoutPresets = sqliteTable(
    'layout_presets',
    {
        id: text('id')
            .primaryKey()
            .$defaultFn(() => crypto.randomUUID()),
        vendorId: text('vendor_id')
            .notNull()
            .default('default')
            .references(() => vendors.id, { onDelete: 'cascade' }),
        name: text('name').notNull(),
        slug: text('slug').notNull(),
        config: text('config', { mode: 'json' })
            .notNull()
            .$defaultFn(() => ({})),
        createdAt: text('created_at')
            .notNull()
            .$defaultFn(() => new Date().toISOString()),
        updatedAt: text('updated_at')
            .notNull()
            .$defaultFn(() => new Date().toISOString()),
    },
    (table) => ({
        slugUnique: uniqueIndex('layout_presets_slug_unique').on(table.slug),
    }),
);

export type LayoutPresetRow = typeof layoutPresets.$inferSelect;
export type InsertLayoutPresetRow = typeof layoutPresets.$inferInsert;

// ─── screens ───────────────────────────────────────────────────────────────────

export const screens = sqliteTable(
    'screens',
    {
        id: text('id')
            .primaryKey()
            .$defaultFn(() => crypto.randomUUID()),
        vendorId: text('vendor_id')
            .notNull()
            .default('default')
            .references(() => vendors.id, { onDelete: 'cascade' }),
        name: text('name').notNull(),
        slug: text('slug').notNull(),
        layoutPresetId: text('layout_preset_id').references(() => layoutPresets.id, {
            onDelete: 'set null',
        }),
        fallbackPlaylistId: text('fallback_playlist_id'),
        timezone: text('timezone'),
        orientation: text('orientation').notNull().default('horizontal'),
        locationName: text('location_name'),
        address: text('address'),
        googleMapsUrl: text('google_maps_url'),
        status: text('status').notNull().default('active'),
        createdAt: text('created_at')
            .notNull()
            .$defaultFn(() => new Date().toISOString()),
        updatedAt: text('updated_at')
            .notNull()
            .$defaultFn(() => new Date().toISOString()),
    },
    (table) => ({
        slugUnique: uniqueIndex('screens_slug_unique').on(table.slug),
        statusIdx: index('screens_status_idx').on(table.status),
    }),
);

export type ScreenRow = typeof screens.$inferSelect;
export type InsertScreenRow = typeof screens.$inferInsert;

// ─── content_playlists ─────────────────────────────────────────────────────────

export const contentPlaylists = sqliteTable('content_playlists', {
    id: text('id')
        .primaryKey()
        .$defaultFn(() => crypto.randomUUID()),
    vendorId: text('vendor_id')
        .notNull()
        .default('default')
        .references(() => vendors.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    orientation: text('orientation').notNull().default('horizontal'),
    status: text('status').notNull().default('ready'),
    approvalState: text('approval_state').notNull().default('draft'),
    submittedAt: text('submitted_at'),
    approvedAt: text('approved_at'),
    rejectedAt: text('rejected_at'),
    createdAt: text('created_at')
        .notNull()
        .$defaultFn(() => new Date().toISOString()),
    updatedAt: text('updated_at')
        .notNull()
        .$defaultFn(() => new Date().toISOString()),
});

export type ContentPlaylistRow = typeof contentPlaylists.$inferSelect;
export type InsertContentPlaylistRow = typeof contentPlaylists.$inferInsert;

// ─── content_playlist_items ────────────────────────────────────────────────────

export const contentPlaylistItems = sqliteTable(
    'content_playlist_items',
    {
        id: text('id')
            .primaryKey()
            .$defaultFn(() => crypto.randomUUID()),
        playlistId: text('playlist_id')
            .notNull()
            .references(() => contentPlaylists.id, { onDelete: 'cascade' }),
        assetId: text('asset_id').references(() => mediaAssets.id, { onDelete: 'cascade' }),
        slideId: text('slide_id').references(() => slideAssets.id, { onDelete: 'cascade' }),
        sortOrder: integer('sort_order').notNull(),
        durationSeconds: integer('duration_seconds'),
        createdAt: text('created_at')
            .notNull()
            .$defaultFn(() => new Date().toISOString()),
    },
    (table) => ({
        playlistOrderIdx: index('content_playlist_items_playlist_order_idx').on(
            table.playlistId,
            table.sortOrder,
        ),
    }),
);

export type ContentPlaylistItemRow = typeof contentPlaylistItems.$inferSelect;
export type InsertContentPlaylistItemRow = typeof contentPlaylistItems.$inferInsert;

// ─── playlist_assignments ──────────────────────────────────────────────────────

export const playlistAssignments = sqliteTable(
    'playlist_assignments',
    {
        id: text('id')
            .primaryKey()
            .$defaultFn(() => crypto.randomUUID()),
        screenId: text('screen_id')
            .notNull()
            .references(() => screens.id, { onDelete: 'cascade' }),
        playlistId: text('playlist_id')
            .notNull()
            .references(() => contentPlaylists.id, { onDelete: 'cascade' }),
        startDate: text('start_date'),
        endDate: text('end_date'),
        weekdays: text('weekdays', { mode: 'json' })
            .notNull()
            .$defaultFn(() => []),
        priority: integer('priority').notNull().default(0),
        status: text('status').notNull().default('active'),
        createdAt: text('created_at')
            .notNull()
            .$defaultFn(() => new Date().toISOString()),
        updatedAt: text('updated_at')
            .notNull()
            .$defaultFn(() => new Date().toISOString()),
    },
    (table) => ({
        screenStatusIdx: index('playlist_assignments_screen_status_idx').on(
            table.screenId,
            table.status,
        ),
    }),
);

export type PlaylistAssignmentRow = typeof playlistAssignments.$inferSelect;
export type InsertPlaylistAssignmentRow = typeof playlistAssignments.$inferInsert;

// ─── Re-export sql helper so callers can do `import { sql } from '@/lib/db/schema'` ─
export { sql };
