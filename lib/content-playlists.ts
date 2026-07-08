import { cache } from 'react';
import { and, asc, desc, eq, inArray } from 'drizzle-orm';

import { requireTenantScope, tenantScopeOrGlobal, tenantValue, tenantWhere } from './auth/tenancy';
import { getDb } from './db/client';
import {
    contentPlaylistItems,
    contentPlaylists,
    mediaAssets,
    playlistAssignments,
    screens,
    slideAssets,
    type ContentPlaylistItemRow,
    type ContentPlaylistRow,
    type PlaylistAssignmentRow,
} from './db/schema';
import { isoDateInTimezone } from './helpers/time';

import type { MediaAsset, SlideAsset } from './types';

export type ContentPlaylistStatus = 'draft' | 'ready' | 'archived';
export type ContentPlaylistApprovalState = 'draft' | 'submitted' | 'approved' | 'rejected';
export type PlaylistOrientation = 'horizontal' | 'vertical';
export type WeekdayKey = 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun';

export type ContentPlaylist = {
    id: string;
    vendorId: string;
    name: string;
    orientation: PlaylistOrientation;
    status: ContentPlaylistStatus;
    approvalState: ContentPlaylistApprovalState;
    submittedAt: string | null;
    approvedAt: string | null;
    rejectedAt: string | null;
    itemCount: number;
    createdAt: string;
    updatedAt: string;
};

export type ContentPlaylistItem = {
    id: string;
    playlistId: string;
    assetId: string | null;
    slideId: string | null;
    sortOrder: number;
    durationSeconds: number | null;
    createdAt: string;
};

export type ContentPlaylistDetail = ContentPlaylist & {
    items: ContentPlaylistItem[];
};

export type PlaylistAssignment = {
    id: string;
    screenId: string;
    playlistId: string;
    startDate: string | null;
    endDate: string | null;
    weekdays: WeekdayKey[];
    priority: number;
    status: string;
    createdAt: string;
    updatedAt: string;
};

export type PlaylistCarouselCard = {
    kind: 'slide' | 'asset';
    id: string;
    durationSeconds: number;
};

export type PlaylistCarouselSelection = {
    kind: 'slide' | 'asset';
    slide?: SlideAsset;
    asset?: MediaAsset;
    card: PlaylistCarouselCard;
    index: number;
    elapsedSeconds: number;
    totalDurationSeconds: number;
    playlistUpdatedAt: string;
};

export const listContentPlaylists = cache(async (): Promise<ContentPlaylist[]> => {
    const scope = await tenantScopeOrGlobal();
    const db = await getDb();
    const rows = await db
        .select()
        .from(contentPlaylists)
        .where(tenantWhere(contentPlaylists.vendorId, scope))
        .orderBy(asc(contentPlaylists.name));
    const counts = await playlistItemCounts(rows.map((row) => row.id));

    return rows.map((row) => mapPlaylist(row, counts.get(row.id) ?? 0));
});

export async function getContentPlaylist(
    playlistId: string,
): Promise<ContentPlaylistDetail | null> {
    const scope = await tenantScopeOrGlobal();
    const db = await getDb();
    const [row] = await db
        .select()
        .from(contentPlaylists)
        .where(eq(contentPlaylists.id, playlistId))
        .limit(1);

    if (!row || (scope?.kind === 'vendor' && row.vendorId !== scope.vendorId)) {
        return null;
    }

    const items = await db
        .select()
        .from(contentPlaylistItems)
        .where(eq(contentPlaylistItems.playlistId, playlistId))
        .orderBy(asc(contentPlaylistItems.sortOrder));

    return {
        ...mapPlaylist(row, items.length),
        items: items.map(mapPlaylistItem),
    };
}

export async function createContentPlaylist(input: {
    name: string;
    status?: ContentPlaylistStatus;
    orientation?: PlaylistOrientation;
}): Promise<ContentPlaylist> {
    const scope = await requireTenantScope();
    const db = await getDb();
    const now = new Date().toISOString();
    const id = crypto.randomUUID();

    await db.insert(contentPlaylists).values({
        id,
        vendorId: tenantValue(scope),
        name: input.name.trim(),
        orientation: normalizeOrientation(input.orientation),
        status: input.status ?? 'draft',
        approvalState: 'draft',
        createdAt: now,
        updatedAt: now,
    });

    return {
        id,
        vendorId: tenantValue(scope),
        name: input.name.trim(),
        orientation: normalizeOrientation(input.orientation),
        status: input.status ?? 'draft',
        approvalState: 'draft',
        submittedAt: null,
        approvedAt: null,
        rejectedAt: null,
        itemCount: 0,
        createdAt: now,
        updatedAt: now,
    };
}

export async function updateContentPlaylist(
    id: string,
    input: Partial<{
        name: string;
        status: ContentPlaylistStatus;
        orientation: PlaylistOrientation;
    }>,
): Promise<ContentPlaylist | null> {
    const scope = await requireTenantScope();
    const db = await getDb();
    const now = new Date().toISOString();
    const patch: Partial<ContentPlaylistRow> = { updatedAt: now };

    if (input.name !== undefined) {
        patch.name = input.name.trim();
    }

    if (input.status !== undefined) {
        patch.status = input.status;
    }

    if (input.orientation !== undefined) {
        patch.orientation = normalizeOrientation(input.orientation);
    }

    if (scope.kind === 'vendor') {
        patch.status = 'draft';
        patch.approvalState = 'draft';
        patch.submittedAt = null;
        patch.approvedAt = null;
        patch.rejectedAt = null;
    }

    await db
        .update(contentPlaylists)
        .set(patch)
        .where(
            scope.kind === 'vendor'
                ? and(eq(contentPlaylists.id, id), eq(contentPlaylists.vendorId, scope.vendorId))
                : eq(contentPlaylists.id, id),
        );
    const detail = await getContentPlaylist(id);

    if (!detail) {
        return null;
    }

    return {
        id: detail.id,
        vendorId: detail.vendorId,
        name: detail.name,
        orientation: detail.orientation,
        status: detail.status as ContentPlaylistStatus,
        approvalState: detail.approvalState,
        submittedAt: detail.submittedAt,
        approvedAt: detail.approvedAt,
        rejectedAt: detail.rejectedAt,
        itemCount: detail.items.length,
        createdAt: detail.createdAt,
        updatedAt: detail.updatedAt,
    };
}

export async function submitContentPlaylist(id: string): Promise<ContentPlaylist | null> {
    const scope = await requireTenantScope();
    const db = await getDb();
    const now = new Date().toISOString();
    const playlist = await getContentPlaylist(id);

    if (!playlist) {
        return null;
    }

    if (!playlist.items.length) {
        throw new Error('Playlist needs at least one item before submission');
    }

    await db
        .update(contentPlaylists)
        .set({
            status: 'draft',
            approvalState: 'submitted',
            submittedAt: now,
            approvedAt: null,
            rejectedAt: null,
            updatedAt: now,
        })
        .where(
            scope.kind === 'vendor'
                ? and(eq(contentPlaylists.id, id), eq(contentPlaylists.vendorId, scope.vendorId))
                : eq(contentPlaylists.id, id),
        );

    return contentPlaylistSummary(id);
}

export async function approveContentPlaylist(id: string): Promise<ContentPlaylist | null> {
    const scope = await requireTenantScope();

    if (scope.kind !== 'global') {
        throw new Error('Only super admins can approve playlists');
    }

    const db = await getDb();
    const now = new Date().toISOString();
    const playlist = await getContentPlaylist(id);

    if (!playlist) {
        return null;
    }

    if (!playlist.items.length) {
        throw new Error('Playlist needs at least one item before approval');
    }

    await db
        .update(contentPlaylists)
        .set({
            status: 'ready',
            approvalState: 'approved',
            approvedAt: now,
            rejectedAt: null,
            updatedAt: now,
        })
        .where(eq(contentPlaylists.id, id));

    return contentPlaylistSummary(id);
}

export async function rejectContentPlaylist(id: string): Promise<ContentPlaylist | null> {
    const scope = await requireTenantScope();

    if (scope.kind !== 'global') {
        throw new Error('Only super admins can reject playlists');
    }

    const db = await getDb();
    const now = new Date().toISOString();

    await db
        .update(contentPlaylists)
        .set({
            status: 'draft',
            approvalState: 'rejected',
            rejectedAt: now,
            updatedAt: now,
        })
        .where(eq(contentPlaylists.id, id));

    return contentPlaylistSummary(id);
}

export async function setContentPlaylistItems(
    playlistId: string,
    items: Array<{
        assetId?: string | null;
        slideId?: string | null;
        durationSeconds?: number | null;
    }>,
): Promise<void> {
    const scope = await requireTenantScope();
    const playlist = await getContentPlaylist(playlistId);

    if (!playlist) {
        throw new Error('Playlist not found');
    }

    if (scope.kind === 'vendor' && playlist.vendorId !== scope.vendorId) {
        throw new Error('Playlist not found');
    }

    const db = await getDb();
    const now = new Date().toISOString();
    const assetIds = items.map((item) => item.assetId).filter(Boolean) as string[];
    const slideIds = items.map((item) => item.slideId).filter(Boolean) as string[];

    if (assetIds.length) {
        const assets = await db
            .select({ id: mediaAssets.id })
            .from(mediaAssets)
            .where(
                and(inArray(mediaAssets.id, assetIds), eq(mediaAssets.vendorId, playlist.vendorId)),
            );

        if (assets.length !== new Set(assetIds).size) {
            throw new Error('Playlist contains media from another vendor');
        }
    }

    if (slideIds.length) {
        const slides = await db
            .select({ id: slideAssets.id })
            .from(slideAssets)
            .where(
                and(inArray(slideAssets.id, slideIds), eq(slideAssets.vendorId, playlist.vendorId)),
            );

        if (slides.length !== new Set(slideIds).size) {
            throw new Error('Playlist contains plates from another vendor');
        }
    }

    await db.delete(contentPlaylistItems).where(eq(contentPlaylistItems.playlistId, playlistId));

    if (items.length) {
        await db.insert(contentPlaylistItems).values(
            items.map((item, index) => ({
                id: crypto.randomUUID(),
                playlistId,
                assetId: item.assetId ?? null,
                slideId: item.slideId ?? null,
                sortOrder: index,
                durationSeconds: item.durationSeconds ?? null,
                createdAt: now,
            })),
        );
    }

    await db
        .update(contentPlaylists)
        .set(
            scope.kind === 'vendor'
                ? {
                      status: 'draft',
                      approvalState: 'draft',
                      submittedAt: null,
                      approvedAt: null,
                      rejectedAt: null,
                      updatedAt: now,
                  }
                : { updatedAt: now },
        )
        .where(eq(contentPlaylists.id, playlistId));
}

export async function listAssignmentsForScreen(screenId: string): Promise<PlaylistAssignment[]> {
    const scope = await tenantScopeOrGlobal();
    const db = await getDb();
    const [screen] = await db
        .select({ vendorId: screens.vendorId })
        .from(screens)
        .where(eq(screens.id, screenId))
        .limit(1);

    if (!screen || (scope?.kind === 'vendor' && screen.vendorId !== scope.vendorId)) {
        return [];
    }
    const rows = await db
        .select()
        .from(playlistAssignments)
        .where(eq(playlistAssignments.screenId, screenId))
        .orderBy(desc(playlistAssignments.priority), asc(playlistAssignments.startDate));

    return rows.map(mapAssignment);
}

export async function createPlaylistAssignment(input: {
    screenId: string;
    playlistId: string;
    startDate?: string | null;
    endDate?: string | null;
    weekdays?: WeekdayKey[];
    priority?: number;
}): Promise<PlaylistAssignment> {
    const scope = await requireTenantScope();
    const db = await getDb();
    const [screen] = await db
        .select({ vendorId: screens.vendorId, orientation: screens.orientation })
        .from(screens)
        .where(eq(screens.id, input.screenId))
        .limit(1);
    const [playlist] = await db
        .select({
            vendorId: contentPlaylists.vendorId,
            orientation: contentPlaylists.orientation,
            status: contentPlaylists.status,
            approvalState: contentPlaylists.approvalState,
        })
        .from(contentPlaylists)
        .where(eq(contentPlaylists.id, input.playlistId))
        .limit(1);

    if (!screen || !playlist || screen.vendorId !== playlist.vendorId) {
        throw new Error('Playlist and screen must belong to the same vendor');
    }

    if (normalizeOrientation(screen.orientation) !== normalizeOrientation(playlist.orientation)) {
        throw new Error('Playlist orientation does not match screen orientation');
    }

    if (playlist.status !== 'ready' || playlist.approvalState !== 'approved') {
        throw new Error('Playlist must be approved before assignment');
    }

    const playlistItems = await db
        .select({ id: contentPlaylistItems.id })
        .from(contentPlaylistItems)
        .where(eq(contentPlaylistItems.playlistId, input.playlistId))
        .limit(1);

    if (!playlistItems.length) {
        throw new Error('Playlist needs at least one item before assignment');
    }

    if (scope.kind === 'vendor' && playlist.vendorId !== scope.vendorId) {
        throw new Error('Playlist not found');
    }
    const now = new Date().toISOString();
    const id = crypto.randomUUID();

    await db.insert(playlistAssignments).values({
        id,
        screenId: input.screenId,
        playlistId: input.playlistId,
        startDate: input.startDate ?? null,
        endDate: input.endDate ?? null,
        weekdays: input.weekdays ?? [],
        priority: input.priority ?? 0,
        status: 'active',
        createdAt: now,
        updatedAt: now,
    });

    return {
        id,
        screenId: input.screenId,
        playlistId: input.playlistId,
        startDate: input.startDate ?? null,
        endDate: input.endDate ?? null,
        weekdays: input.weekdays ?? [],
        priority: input.priority ?? 0,
        status: 'active',
        createdAt: now,
        updatedAt: now,
    };
}

export async function deletePlaylistAssignment(id: string): Promise<void> {
    const scope = await requireTenantScope();
    const db = await getDb();
    const [assignment] = await db
        .select({ screenId: playlistAssignments.screenId })
        .from(playlistAssignments)
        .where(eq(playlistAssignments.id, id))
        .limit(1);

    if (!assignment) {
        return;
    }

    if (scope.kind === 'vendor') {
        const [screen] = await db
            .select({ vendorId: screens.vendorId })
            .from(screens)
            .where(eq(screens.id, assignment.screenId))
            .limit(1);

        if (!screen || screen.vendorId !== scope.vendorId) {
            throw new Error('Assignment not found');
        }
    }

    await db.delete(playlistAssignments).where(eq(playlistAssignments.id, id));
}

export function isPlayableContentPlaylist(
    playlist: Pick<ContentPlaylist, 'status' | 'approvalState' | 'itemCount'>,
) {
    return (
        playlist.status === 'ready' &&
        playlist.approvalState === 'approved' &&
        playlist.itemCount > 0
    );
}

export function resolveActiveAssignment(
    assignments: PlaylistAssignment[],
    date: string,
    weekday: WeekdayKey,
): PlaylistAssignment | null {
    const active = assignments
        .filter((assignment) => assignment.status === 'active')
        .filter((assignment) => matchesDateRange(assignment, date))
        .filter((assignment) => matchesWeekday(assignment, weekday))
        .sort((a, b) => b.priority - a.priority);

    return active[0] ?? null;
}

export function weekdayKeyForDate(date: Date, timezone: string): WeekdayKey {
    const weekday = new Intl.DateTimeFormat('en-US', {
        timeZone: timezone,
        weekday: 'short',
    })
        .format(date)
        .slice(0, 3)
        .toLowerCase();

    return weekday as WeekdayKey;
}

export async function resolvePlaylistForScreen(input: {
    screenId: string;
    fallbackPlaylistId: string | null;
    now: Date;
    timezone: string;
}): Promise<{ playlistId: string | null; reason: string; assignment: PlaylistAssignment | null }> {
    const assignments = await listAssignmentsForScreen(input.screenId);
    const today = isoDateInTimezone(input.now, input.timezone);
    const weekday = weekdayKeyForDate(input.now, input.timezone);
    const assignment = resolveActiveAssignment(assignments, today, weekday);

    if (assignment) {
        return {
            playlistId: assignment.playlistId,
            reason: 'assigned-playlist',
            assignment,
        };
    }

    if (input.fallbackPlaylistId) {
        return {
            playlistId: input.fallbackPlaylistId,
            reason: 'fallback-playlist',
            assignment: null,
        };
    }

    return {
        playlistId: null,
        reason: 'no-playlist',
        assignment: null,
    };
}

export function buildPlaylistCarouselCards(
    items: ContentPlaylistItem[],
    assets: MediaAsset[],
    slides: SlideAsset[],
): PlaylistCarouselCard[] {
    const assetById = new Map(assets.map((asset) => [asset.id, asset]));
    const slideById = new Map(slides.map((slide) => [slide.id, slide]));

    return items
        .map((item) => {
            if (item.assetId) {
                const asset = assetById.get(item.assetId);

                if (!asset || !isPlayablePlaylistAsset(asset)) {
                    return null;
                }

                return {
                    kind: 'asset' as const,
                    id: asset.id,
                    durationSeconds:
                        item.durationSeconds ??
                        asset.durationSeconds ??
                        (asset.mediaKind === 'image' ? 15 : 30),
                };
            }

            if (item.slideId) {
                const slide = slideById.get(item.slideId);

                if (!slide || slide.status !== 'ready') {
                    return null;
                }

                return {
                    kind: 'slide' as const,
                    id: slide.id,
                    durationSeconds: item.durationSeconds ?? slide.defaultDurationSeconds ?? 30,
                };
            }

            return null;
        })
        .filter((card): card is PlaylistCarouselCard => Boolean(card));
}

export function selectPlaylistCarouselItem(
    cards: PlaylistCarouselCard[],
    bundle: { mediaAssets: MediaAsset[]; slideAssets: SlideAsset[] },
    serverSeconds: number,
    playlistUpdatedAt: string,
): PlaylistCarouselSelection | null {
    if (!cards.length) {
        return null;
    }

    const slideById = new Map(
        bundle.slideAssets
            .filter((slide) => slide.status === 'ready')
            .map((slide) => [slide.id, slide]),
    );
    const assetById = new Map(
        bundle.mediaAssets.filter(isPlayablePlaylistAsset).map((asset) => [asset.id, asset]),
    );
    const playable = cards.filter((card) =>
        card.kind === 'asset' ? assetById.has(card.id) : slideById.has(card.id),
    );

    if (!playable.length) {
        return null;
    }

    const totalDurationSeconds = playable.reduce((total, card) => total + card.durationSeconds, 0);

    if (totalDurationSeconds <= 0) {
        return null;
    }

    const loopSecond = Math.max(0, Math.floor(serverSeconds)) % totalDurationSeconds;
    let cursor = 0;

    for (const [index, card] of playable.entries()) {
        const nextCursor = cursor + card.durationSeconds;

        if (loopSecond < nextCursor) {
            const slide = card.kind === 'slide' ? slideById.get(card.id) : undefined;
            const asset = card.kind === 'asset' ? assetById.get(card.id) : undefined;

            if (!slide && !asset) {
                return null;
            }

            return {
                kind: card.kind,
                ...(slide ? { slide } : {}),
                ...(asset ? { asset } : {}),
                card,
                index,
                elapsedSeconds: loopSecond - cursor,
                totalDurationSeconds,
                playlistUpdatedAt,
            };
        }
        cursor = nextCursor;
    }

    return null;
}

export function isPlayablePlaylistAsset(asset: MediaAsset) {
    if (asset.status !== 'ready') {
        return false;
    }

    if (asset.mediaKind === 'image' || asset.sourceType.includes('image')) {
        return Boolean(asset.url || asset.storagePath);
    }

    return Boolean(asset.url || asset.storagePath);
}

function matchesDateRange(assignment: PlaylistAssignment, date: string) {
    if (assignment.startDate && date < assignment.startDate) {
        return false;
    }

    if (assignment.endDate && date > assignment.endDate) {
        return false;
    }

    return true;
}

function matchesWeekday(assignment: PlaylistAssignment, weekday: WeekdayKey) {
    if (!assignment.weekdays.length) {
        return true;
    }

    return assignment.weekdays.includes(weekday);
}

async function playlistItemCounts(ids: string[]) {
    const counts = new Map<string, number>();

    if (!ids.length) {
        return counts;
    }

    const db = await getDb();
    const rows = await db
        .select({
            playlistId: contentPlaylistItems.playlistId,
        })
        .from(contentPlaylistItems)
        .where(inArray(contentPlaylistItems.playlistId, ids));

    for (const row of rows) {
        counts.set(row.playlistId, (counts.get(row.playlistId) ?? 0) + 1);
    }

    return counts;
}

function mapPlaylist(row: ContentPlaylistRow, itemCount: number): ContentPlaylist {
    return {
        id: row.id,
        vendorId: row.vendorId,
        name: row.name,
        orientation: normalizeOrientation(row.orientation),
        status: row.status as ContentPlaylistStatus,
        approvalState: normalizeApprovalState(row.approvalState),
        submittedAt: row.submittedAt ?? null,
        approvedAt: row.approvedAt ?? null,
        rejectedAt: row.rejectedAt ?? null,
        itemCount,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
    };
}

async function contentPlaylistSummary(id: string): Promise<ContentPlaylist | null> {
    const detail = await getContentPlaylist(id);

    if (!detail) {
        return null;
    }

    return {
        id: detail.id,
        vendorId: detail.vendorId,
        name: detail.name,
        orientation: detail.orientation,
        status: detail.status,
        approvalState: detail.approvalState,
        submittedAt: detail.submittedAt,
        approvedAt: detail.approvedAt,
        rejectedAt: detail.rejectedAt,
        itemCount: detail.items.length,
        createdAt: detail.createdAt,
        updatedAt: detail.updatedAt,
    };
}

function normalizeOrientation(value: string | null | undefined): PlaylistOrientation {
    return value === 'vertical' ? 'vertical' : 'horizontal';
}

function normalizeApprovalState(value: string | null | undefined): ContentPlaylistApprovalState {
    if (value === 'submitted' || value === 'approved' || value === 'rejected') {
        return value;
    }

    return 'draft';
}

function mapPlaylistItem(row: ContentPlaylistItemRow): ContentPlaylistItem {
    return {
        id: row.id,
        playlistId: row.playlistId,
        assetId: row.assetId,
        slideId: row.slideId,
        sortOrder: row.sortOrder,
        durationSeconds: row.durationSeconds,
        createdAt: row.createdAt,
    };
}

function mapAssignment(row: PlaylistAssignmentRow): PlaylistAssignment {
    const weekdays = Array.isArray(row.weekdays)
        ? row.weekdays.filter((day): day is WeekdayKey => typeof day === 'string')
        : [];

    return {
        id: row.id,
        screenId: row.screenId,
        playlistId: row.playlistId,
        startDate: row.startDate,
        endDate: row.endDate,
        weekdays,
        priority: row.priority,
        status: row.status,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
    };
}
