import { cache } from 'react';
import { and, asc, eq } from 'drizzle-orm';

import { requireTenantScope, tenantScopeOrGlobal, tenantValue, tenantWhere } from './auth/tenancy';
import { getDb } from './db/client';
import { layoutPresets, screens, vendors, type LayoutPresetRow, type ScreenRow } from './db/schema';
import { PLAYOUT_TIMEZONE } from './helpers/time';

export type LayoutPreset = {
    id: string;
    vendorId: string;
    name: string;
    slug: string;
    config: Record<string, unknown>;
    createdAt: string;
    updatedAt: string;
};

export type Screen = {
    id: string;
    vendorId: string;
    name: string;
    slug: string;
    layoutPresetId: string | null;
    fallbackPlaylistId: string | null;
    timezone: string;
    orientation: ScreenOrientation;
    locationName: string | null;
    address: string | null;
    googleMapsUrl: string | null;
    status: string;
    createdAt: string;
    updatedAt: string;
};

export type ScreenOrientation = 'horizontal' | 'vertical';

export const listScreens = cache(async (): Promise<Screen[]> => {
    await ensureSignageBootstrap();
    const scope = await tenantScopeOrGlobal();
    const db = await getDb();
    const rows = await db
        .select()
        .from(screens)
        .where(tenantWhere(screens.vendorId, scope))
        .orderBy(asc(screens.name));

    return rows.map(mapScreen);
});

export async function getScreenBySlug(slug: string): Promise<Screen | null> {
    await ensureSignageBootstrap();
    const scope = await tenantScopeOrGlobal();
    const db = await getDb();
    const [row] = await db.select().from(screens).where(eq(screens.slug, slug)).limit(1);

    if (!row || (scope?.kind === 'vendor' && row.vendorId !== scope.vendorId)) {
        return null;
    }

    return mapScreen(row);
}

export async function getScreenById(id: string): Promise<Screen | null> {
    await ensureSignageBootstrap();
    const scope = await tenantScopeOrGlobal();
    const db = await getDb();
    const [row] = await db.select().from(screens).where(eq(screens.id, id)).limit(1);

    if (!row || (scope?.kind === 'vendor' && row.vendorId !== scope.vendorId)) {
        return null;
    }

    return mapScreen(row);
}

export const listLayoutPresets = cache(async (): Promise<LayoutPreset[]> => {
    await ensureSignageBootstrap();
    const scope = await tenantScopeOrGlobal();
    const db = await getDb();
    const rows = await db
        .select()
        .from(layoutPresets)
        .where(tenantWhere(layoutPresets.vendorId, scope))
        .orderBy(asc(layoutPresets.name));

    return rows.map(mapLayoutPreset);
});

export async function createLayoutPreset(input: {
    name: string;
    slug: string;
    config?: Record<string, unknown>;
}): Promise<LayoutPreset> {
    const scope = await requireTenantScope();
    const db = await getDb();
    const now = new Date().toISOString();
    const id = crypto.randomUUID();

    await db.insert(layoutPresets).values({
        id,
        vendorId: tenantValue(scope),
        name: input.name.trim(),
        slug: normalizeSlug(input.slug),
        config: input.config ?? {},
        createdAt: now,
        updatedAt: now,
    });

    return {
        id,
        vendorId: tenantValue(scope),
        name: input.name.trim(),
        slug: normalizeSlug(input.slug),
        config: input.config ?? {},
        createdAt: now,
        updatedAt: now,
    };
}

export async function createScreen(input: {
    name: string;
    slug: string;
    layoutPresetId?: string | null;
    fallbackPlaylistId?: string | null;
    timezone?: string | null;
    orientation?: ScreenOrientation | null;
    locationName?: string | null;
    address?: string | null;
    googleMapsUrl?: string | null;
}): Promise<Screen> {
    await ensureSignageBootstrap();
    const scope = await requireTenantScope();
    const db = await getDb();
    const now = new Date().toISOString();
    const id = crypto.randomUUID();

    await db.insert(screens).values({
        id,
        vendorId: tenantValue(scope),
        name: input.name.trim(),
        slug: normalizeSlug(input.slug),
        layoutPresetId: input.layoutPresetId ?? null,
        fallbackPlaylistId: input.fallbackPlaylistId ?? null,
        timezone: input.timezone ?? null,
        orientation: normalizeOrientation(input.orientation),
        locationName: cleanOptional(input.locationName),
        address: cleanOptional(input.address),
        googleMapsUrl: cleanOptional(input.googleMapsUrl),
        status: 'active',
        createdAt: now,
        updatedAt: now,
    });

    return {
        id,
        vendorId: tenantValue(scope),
        name: input.name.trim(),
        slug: normalizeSlug(input.slug),
        layoutPresetId: input.layoutPresetId ?? null,
        fallbackPlaylistId: input.fallbackPlaylistId ?? null,
        timezone: input.timezone ?? PLAYOUT_TIMEZONE,
        orientation: normalizeOrientation(input.orientation),
        locationName: cleanOptional(input.locationName),
        address: cleanOptional(input.address),
        googleMapsUrl: cleanOptional(input.googleMapsUrl),
        status: 'active',
        createdAt: now,
        updatedAt: now,
    };
}

export async function updateScreen(
    id: string,
    input: Partial<{
        name: string;
        slug: string;
        layoutPresetId: string | null;
        fallbackPlaylistId: string | null;
        timezone: string | null;
        orientation: ScreenOrientation | null;
        locationName: string | null;
        address: string | null;
        googleMapsUrl: string | null;
        status: string;
    }>,
): Promise<Screen | null> {
    const scope = await requireTenantScope();
    const db = await getDb();
    const now = new Date().toISOString();
    const patch: Partial<ScreenRow> = { updatedAt: now };

    if (input.name !== undefined) {
        patch.name = input.name.trim();
    }

    if (input.slug !== undefined) {
        patch.slug = normalizeSlug(input.slug);
    }

    if (input.layoutPresetId !== undefined) {
        patch.layoutPresetId = input.layoutPresetId;
    }

    if (input.fallbackPlaylistId !== undefined) {
        patch.fallbackPlaylistId = input.fallbackPlaylistId;
    }

    if (input.timezone !== undefined) {
        patch.timezone = input.timezone;
    }

    if (input.orientation !== undefined) {
        patch.orientation = normalizeOrientation(input.orientation);
    }

    if (input.locationName !== undefined) {
        patch.locationName = cleanOptional(input.locationName);
    }

    if (input.address !== undefined) {
        patch.address = cleanOptional(input.address);
    }

    if (input.googleMapsUrl !== undefined) {
        patch.googleMapsUrl = cleanOptional(input.googleMapsUrl);
    }

    if (input.status !== undefined) {
        patch.status = input.status;
    }

    await db
        .update(screens)
        .set(patch)
        .where(
            scope.kind === 'vendor'
                ? and(eq(screens.id, id), eq(screens.vendorId, scope.vendorId))
                : eq(screens.id, id),
        );

    return getScreenById(id);
}

async function ensureSignageBootstrap() {
    const db = await getDb();
    await db
        .insert(vendors)
        .values({ id: 'default', name: 'Default Vendor', slug: 'default', status: 'active' })
        .onConflictDoNothing();
    const existing = await db.select({ id: screens.id }).from(screens).limit(1);

    if (existing.length) {
        return;
    }

    const now = new Date().toISOString();
    const presetId = crypto.randomUUID();
    const screenId = crypto.randomUUID();

    await db.insert(layoutPresets).values({
        id: presetId,
        vendorId: 'default',
        name: 'Default',
        slug: 'default',
        config: {},
        createdAt: now,
        updatedAt: now,
    });

    await db.insert(screens).values({
        id: screenId,
        vendorId: 'default',
        name: 'Main',
        slug: 'main',
        layoutPresetId: presetId,
        timezone: PLAYOUT_TIMEZONE,
        orientation: 'horizontal',
        locationName: 'Default location',
        address: null,
        googleMapsUrl: null,
        status: 'active',
        createdAt: now,
        updatedAt: now,
    });
}

function mapScreen(row: ScreenRow): Screen {
    return {
        id: row.id,
        vendorId: row.vendorId,
        name: row.name,
        slug: row.slug,
        layoutPresetId: row.layoutPresetId,
        fallbackPlaylistId: row.fallbackPlaylistId,
        timezone: row.timezone ?? PLAYOUT_TIMEZONE,
        orientation: normalizeOrientation(row.orientation),
        locationName: row.locationName ?? null,
        address: row.address ?? null,
        googleMapsUrl: row.googleMapsUrl ?? null,
        status: row.status,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
    };
}

export function screenMapsHref(screen: Pick<Screen, 'address' | 'googleMapsUrl'>) {
    if (screen.googleMapsUrl) {
        return screen.googleMapsUrl;
    }

    if (!screen.address) {
        return null;
    }

    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(screen.address)}`;
}

export function screenMapsEmbedSrc(screen: Pick<Screen, 'address' | 'googleMapsUrl'>) {
    if (!screen.address && !screen.googleMapsUrl) {
        return null;
    }

    const query = screen.address || screen.googleMapsUrl || '';

    return `https://www.google.com/maps?q=${encodeURIComponent(query)}&output=embed`;
}

function cleanOptional(value: string | null | undefined) {
    const trimmed = value?.trim();

    return trimmed ? trimmed : null;
}

function normalizeOrientation(value: string | null | undefined): ScreenOrientation {
    return value === 'vertical' ? 'vertical' : 'horizontal';
}

function mapLayoutPreset(row: LayoutPresetRow): LayoutPreset {
    const config =
        row.config && typeof row.config === 'object' && !Array.isArray(row.config)
            ? (row.config as Record<string, unknown>)
            : {};

    return {
        id: row.id,
        vendorId: row.vendorId,
        name: row.name,
        slug: row.slug,
        config,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
    };
}

function normalizeSlug(value: string) {
    return value
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9-]+/g, '-')
        .replace(/^-+|-+$/g, '');
}
