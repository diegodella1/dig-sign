import { cache } from 'react';
import { and, asc, desc, eq, inArray } from 'drizzle-orm';

import { requireTenantScope, tenantScopeOrGlobal, tenantValue, tenantWhere } from './auth/tenancy';
import { getDb } from './db/client';
import {
    integrationSettings,
    mediaAssets,
    musicPlaylistItems,
    musicPlaylists,
    operatorPreferences,
    vendors,
    type MediaAssetRow,
    type MusicPlaylistRow,
} from './db/schema';

export type MusicPlaylistStatus = 'draft' | 'ready' | 'archived';

export type MusicPlaylist = {
    id: string;
    vendorId: string;
    name: string;
    status: MusicPlaylistStatus;
    itemCount: number;
    createdAt: string;
    updatedAt: string;
};

export type MusicPlaylistDetail = MusicPlaylist & {
    assetIds: string[];
};

export type MusicPlaylistTrack = {
    id: string;
    title: string;
    url: string;
};

export type MusicOutputSettings = {
    enabled: boolean;
    volume: number;
    fade: 'none' | 'short';
    schedulePlaylistId: string | null;
    fallbackPlaylistId: string | null;
};

export type BackgroundMusicPayload = {
    enabled: boolean;
    volume: number;
    fade: 'none' | 'short';
    tracks: MusicPlaylistTrack[];
    playlistId: string;
};

export const MUSIC_OUTPUT_PROVIDER = 'music_output';

export const getMusicOutputSettings = cache(
    async (vendorId?: string): Promise<MusicOutputSettings> => {
        await ensureMusicBootstrap();
        const scope = vendorId ? null : await tenantScopeOrGlobal();
        const provider = musicOutputProvider(
            vendorId ?? (scope?.kind === 'vendor' ? scope.vendorId : 'default'),
        );
        const db = await getDb();
        const [row] = await db
            .select({
                publicConfig: integrationSettings.publicConfig,
            })
            .from(integrationSettings)
            .where(eq(integrationSettings.provider, provider))
            .limit(1);

        return parseMusicOutputSettings(row?.publicConfig);
    },
);

export async function saveMusicOutputSettings(
    input: Partial<MusicOutputSettings>,
): Promise<MusicOutputSettings> {
    await ensureMusicBootstrap();
    const scope = await requireTenantScope();
    const vendorId = tenantValue(scope);
    const provider = musicOutputProvider(vendorId);
    const current = await getMusicOutputSettings(vendorId);
    const next = parseMusicOutputSettings({ ...current, ...input });
    const db = await getDb();
    const now = new Date().toISOString();

    await db
        .insert(integrationSettings)
        .values({
            provider,
            publicConfig: next,
            status: 'ready',
            updatedAt: now,
        })
        .onConflictDoUpdate({
            target: integrationSettings.provider,
            set: {
                publicConfig: next,
                status: 'ready',
                updatedAt: now,
            },
        });

    return next;
}

export async function listPlaylists(): Promise<MusicPlaylist[]> {
    await ensureMusicBootstrap();
    const scope = await tenantScopeOrGlobal();
    const db = await getDb();
    const rows = await db
        .select()
        .from(musicPlaylists)
        .where(tenantWhere(musicPlaylists.vendorId, scope))
        .orderBy(asc(musicPlaylists.name));
    const counts = await playlistItemCounts(rows.map((row) => row.id));

    return rows.map((row) => mapPlaylist(row, counts.get(row.id) ?? 0));
}

export async function getPlaylist(playlistId: string): Promise<MusicPlaylistDetail | null> {
    await ensureMusicBootstrap();
    const scope = await tenantScopeOrGlobal();
    const db = await getDb();
    const [row] = await db
        .select()
        .from(musicPlaylists)
        .where(eq(musicPlaylists.id, playlistId))
        .limit(1);

    if (!row || (scope?.kind === 'vendor' && row.vendorId !== scope.vendorId)) {
        return null;
    }

    const items = await db
        .select()
        .from(musicPlaylistItems)
        .where(eq(musicPlaylistItems.playlistId, playlistId))
        .orderBy(asc(musicPlaylistItems.sortOrder));

    return {
        ...mapPlaylist(row, items.length),
        assetIds: items.map((item) => item.assetId),
    };
}

export async function createPlaylist(input: {
    name: string;
    status?: MusicPlaylistStatus;
}): Promise<MusicPlaylist> {
    const scope = await requireTenantScope();
    const db = await getDb();
    const now = new Date().toISOString();
    const id = crypto.randomUUID();

    await db.insert(musicPlaylists).values({
        id,
        vendorId: tenantValue(scope),
        name: input.name.trim(),
        status: input.status ?? 'ready',
        createdAt: now,
        updatedAt: now,
    });

    return mapPlaylist(
        {
            id,
            vendorId: tenantValue(scope),
            name: input.name.trim(),
            status: input.status ?? 'ready',
            createdAt: now,
            updatedAt: now,
        },
        0,
    );
}

export async function updatePlaylist(
    playlistId: string,
    input: { name?: string; status?: MusicPlaylistStatus },
): Promise<MusicPlaylist | null> {
    const scope = await requireTenantScope();
    const db = await getDb();
    const [existing] = await db
        .select()
        .from(musicPlaylists)
        .where(
            scope.kind === 'vendor'
                ? and(
                      eq(musicPlaylists.id, playlistId),
                      eq(musicPlaylists.vendorId, scope.vendorId),
                  )
                : eq(musicPlaylists.id, playlistId),
        )
        .limit(1);

    if (!existing) {
        return null;
    }

    const now = new Date().toISOString();
    const next = {
        name: input.name?.trim() ?? existing.name,
        status: input.status ?? existing.status,
        updatedAt: now,
    };

    await db
        .update(musicPlaylists)
        .set(next)
        .where(
            scope.kind === 'vendor'
                ? and(
                      eq(musicPlaylists.id, playlistId),
                      eq(musicPlaylists.vendorId, scope.vendorId),
                  )
                : eq(musicPlaylists.id, playlistId),
        );
    const counts = await playlistItemCounts([playlistId]);

    return mapPlaylist({ ...existing, ...next }, counts.get(playlistId) ?? 0);
}

export async function archivePlaylist(playlistId: string): Promise<boolean> {
    const updated = await updatePlaylist(playlistId, { status: 'archived' });

    return Boolean(updated);
}

export async function setPlaylistItems(playlistId: string, assetIds: string[]): Promise<boolean> {
    const scope = await requireTenantScope();
    const db = await getDb();
    const [playlist] = await db
        .select({ id: musicPlaylists.id, vendorId: musicPlaylists.vendorId })
        .from(musicPlaylists)
        .where(
            scope.kind === 'vendor'
                ? and(
                      eq(musicPlaylists.id, playlistId),
                      eq(musicPlaylists.vendorId, scope.vendorId),
                  )
                : eq(musicPlaylists.id, playlistId),
        )
        .limit(1);

    if (!playlist) {
        return false;
    }

    const uniqueAssetIds = [...new Set(assetIds)];

    if (uniqueAssetIds.length) {
        const assets = await db
            .select({ id: mediaAssets.id })
            .from(mediaAssets)
            .where(
                and(
                    inArray(mediaAssets.id, uniqueAssetIds),
                    eq(mediaAssets.assetType, 'music'),
                    eq(mediaAssets.vendorId, playlist.vendorId),
                ),
            );

        if (assets.length !== uniqueAssetIds.length) {
            return false;
        }
    }

    await db.delete(musicPlaylistItems).where(eq(musicPlaylistItems.playlistId, playlistId));

    if (uniqueAssetIds.length) {
        const now = new Date().toISOString();
        await db.insert(musicPlaylistItems).values(
            uniqueAssetIds.map((assetId, index) => ({
                id: crypto.randomUUID(),
                playlistId,
                assetId,
                sortOrder: index,
                createdAt: now,
            })),
        );
    }

    await db
        .update(musicPlaylists)
        .set({ updatedAt: new Date().toISOString() })
        .where(eq(musicPlaylists.id, playlistId));

    return true;
}

export async function resolvePlaylistTracks(
    playlistId: string | null | undefined,
    mediaAccessToken = '',
): Promise<MusicPlaylistTrack[]> {
    if (!playlistId) {
        return [];
    }

    const db = await getDb();
    const items = await db
        .select({
            item: musicPlaylistItems,
            asset: mediaAssets,
        })
        .from(musicPlaylistItems)
        .innerJoin(mediaAssets, eq(musicPlaylistItems.assetId, mediaAssets.id))
        .where(eq(musicPlaylistItems.playlistId, playlistId))
        .orderBy(asc(musicPlaylistItems.sortOrder));

    return items
        .map(({ asset }) => asset)
        .filter((asset) => asset.assetType === 'music' && asset.status === 'ready' && asset.url)
        .map((asset) => ({
            id: asset.id,
            title: asset.title,
            url: withMediaAccessToken(asset.url!, mediaAccessToken),
        }));
}

export async function resolveBackgroundMusic(args: {
    context: 'schedule' | 'fallback';
    shouldPlay: boolean;
    vendorId?: string;
    mediaAccessToken?: string;
}): Promise<BackgroundMusicPayload | null> {
    const settings = await getMusicOutputSettings(args.vendorId);

    if (!settings.enabled) {
        return null;
    }

    const playlistId =
        args.context === 'schedule' ? settings.schedulePlaylistId : settings.fallbackPlaylistId;
    const tracks = await resolvePlaylistTracks(playlistId, args.mediaAccessToken ?? '');

    if (!tracks.length || !playlistId) {
        return null;
    }

    return {
        enabled: args.shouldPlay,
        volume: settings.volume,
        fade: settings.fade,
        tracks,
        playlistId,
    };
}

export async function ensureMusicBootstrap() {
    const db = await getDb();
    const [existingPlaylist] = await db
        .select({ id: musicPlaylists.id })
        .from(musicPlaylists)
        .limit(1);

    if (existingPlaylist) {
        return;
    }

    await db
        .insert(vendors)
        .values({ id: 'default', name: 'Default Vendor', slug: 'default', status: 'active' })
        .onConflictDoNothing();

    const musicRows = await db
        .select()
        .from(mediaAssets)
        .where(eq(mediaAssets.assetType, 'music'))
        .orderBy(asc(mediaAssets.title));

    const readyMusic = musicRows
        .filter((row) => row.status === 'ready' && row.url)
        .sort((a, b) => playlistOrderFromMetadata(a) - playlistOrderFromMetadata(b));

    const now = new Date().toISOString();
    const playlistId = crypto.randomUUID();

    await db.insert(musicPlaylists).values({
        id: playlistId,
        vendorId: 'default',
        name: 'Default',
        status: 'ready',
        createdAt: now,
        updatedAt: now,
    });

    if (readyMusic.length) {
        await db.insert(musicPlaylistItems).values(
            readyMusic.map((asset, index) => ({
                id: crypto.randomUUID(),
                playlistId,
                assetId: asset.id,
                sortOrder: index,
                createdAt: now,
            })),
        );
    }

    const [preferenceRow] = await db
        .select({ value: operatorPreferences.value })
        .from(operatorPreferences)
        .where(eq(operatorPreferences.key, 'music'))
        .orderBy(desc(operatorPreferences.updatedAt))
        .limit(1);

    const preference = parseLegacyMusicPreference(preferenceRow?.value);
    const outputSettings: MusicOutputSettings = {
        enabled: preference.enabled,
        volume: preference.volume,
        fade: preference.fade,
        schedulePlaylistId: playlistId,
        fallbackPlaylistId: playlistId,
    };

    await db
        .insert(integrationSettings)
        .values({
            provider: musicOutputProvider('default'),
            publicConfig: outputSettings,
            status: 'ready',
            updatedAt: now,
        })
        .onConflictDoUpdate({
            target: integrationSettings.provider,
            set: {
                publicConfig: outputSettings,
                status: 'ready',
                updatedAt: now,
            },
        });
}

function musicOutputProvider(vendorId: string) {
    return `${MUSIC_OUTPUT_PROVIDER}:${vendorId || 'default'}`;
}

function mapPlaylist(row: MusicPlaylistRow, itemCount: number): MusicPlaylist {
    return {
        id: row.id,
        vendorId: row.vendorId,
        name: row.name,
        status: row.status as MusicPlaylistStatus,
        itemCount,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
    };
}

async function playlistItemCounts(playlistIds: string[]) {
    const counts = new Map<string, number>();

    if (!playlistIds.length) {
        return counts;
    }

    const db = await getDb();
    const rows = await db
        .select()
        .from(musicPlaylistItems)
        .where(inArray(musicPlaylistItems.playlistId, playlistIds));

    for (const row of rows) {
        counts.set(row.playlistId, (counts.get(row.playlistId) ?? 0) + 1);
    }

    return counts;
}

function parseMusicOutputSettings(value: unknown): MusicOutputSettings {
    const source =
        typeof value === 'object' && value !== null ? (value as Record<string, unknown>) : {};
    const volume = Number(source.volume);

    return {
        enabled: source.enabled === true,
        volume: Number.isFinite(volume) ? Math.max(0, Math.min(100, Math.round(volume))) : 50,
        fade: source.fade === 'none' ? 'none' : 'short',
        schedulePlaylistId:
            typeof source.schedulePlaylistId === 'string' ? source.schedulePlaylistId : null,
        fallbackPlaylistId:
            typeof source.fallbackPlaylistId === 'string' ? source.fallbackPlaylistId : null,
    };
}

function parseLegacyMusicPreference(value: unknown) {
    const source =
        typeof value === 'object' && value !== null ? (value as Record<string, unknown>) : {};
    const volume = Number(source.volume);

    return {
        enabled: source.enabled === true,
        volume: Number.isFinite(volume) ? Math.max(0, Math.min(100, Math.round(volume))) : 50,
        fade: source.fade === 'none' ? ('none' as const) : ('short' as const),
    };
}

function playlistOrderFromMetadata(asset: MediaAssetRow) {
    const metadata =
        typeof asset.metadata === 'object' && asset.metadata !== null
            ? (asset.metadata as Record<string, unknown>)
            : {};
    const value = Number(metadata.playlist_order);

    return Number.isFinite(value) ? value : 999;
}

function withMediaAccessToken(value: string, token: string) {
    if (!token || !value.includes('/api/media/assets/')) {
        return value;
    }

    try {
        const url = new URL(value);

        if (url.pathname.startsWith('/api/media/assets/')) {
            url.searchParams.set('token', token);

            return url.toString();
        }

        return value;
    } catch {
        return value;
    }
}
