import { cache } from 'react';

import { and, desc, eq } from 'drizzle-orm';

import { mapAuditEvent, type AuditEvent } from './audit/audit';
import { tenantScopeOrGlobal, tenantWhere } from './auth/tenancy';
import { getDb } from './db/client';
import {
    auditLog,
    mediaAssets,
    slideAssets,
    type AuditLogRow,
    type MediaAssetRow,
    type SlideAssetRow,
} from './db/schema';
import { mockMediaAssets, mockSlideAssets } from './mock-data';

import type { MediaAsset, SlideAsset } from './types';

export function shouldUseDemoData() {
    if (isProductionLikeRuntime() && process.env.ALLOW_DEMO_DATA === 'true') {
        throw new Error('ALLOW_DEMO_DATA cannot be enabled in production');
    }

    return process.env.ALLOW_DEMO_DATA === 'true';
}

export function handleDataFailure<T>(error: unknown, demoValue: T): T {
    if (shouldUseDemoData()) {
        return demoValue;
    }
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Database unavailable: ${message}`);
}

function isProductionLikeRuntime() {
    return (
        process.env.NODE_ENV === 'production' ||
        process.env.APP_BASE_URL?.startsWith('https://') ||
        process.env.NEXT_PUBLIC_APP_BASE_URL?.startsWith('https://')
    );
}

export const getAssets = cache(async (): Promise<MediaAsset[]> => {
    try {
        const scope = await tenantScopeOrGlobal();
        const db = await getDb();
        const rows = await db
            .select()
            .from(mediaAssets)
            .where(tenantWhere(mediaAssets.vendorId, scope))
            .orderBy(desc(mediaAssets.updatedAt));

        return rows.map((row) => mapMediaAsset(row));
    } catch (error) {
        return handleDataFailure(error, mockMediaAssets);
    }
});

export type MediaAssetSummary = Pick<
    MediaAsset,
    | 'id'
    | 'vendorId'
    | 'title'
    | 'status'
    | 'assetType'
    | 'mediaKind'
    | 'durationSeconds'
    | 'createdAt'
>;

export const getAssetSummaries = cache(async (): Promise<MediaAssetSummary[]> => {
    try {
        const scope = await tenantScopeOrGlobal();
        const db = await getDb();
        const rows = await db
            .select({
                id: mediaAssets.id,
                vendorId: mediaAssets.vendorId,
                title: mediaAssets.title,
                status: mediaAssets.status,
                assetType: mediaAssets.assetType,
                mediaKind: mediaAssets.mediaKind,
                durationSeconds: mediaAssets.durationSeconds,
                createdAt: mediaAssets.createdAt,
            })
            .from(mediaAssets)
            .where(tenantWhere(mediaAssets.vendorId, scope))
            .orderBy(desc(mediaAssets.updatedAt));

        return rows.map(mapMediaAssetSummary);
    } catch (error) {
        return handleDataFailure(
            error,
            mockMediaAssets.map((asset) => ({
                id: asset.id,
                title: asset.title,
                status: asset.status,
                assetType: asset.assetType,
                mediaKind: asset.mediaKind,
                durationSeconds: asset.durationSeconds ?? null,
                createdAt: asset.createdAt,
            })),
        );
    }
});

export const getMediaAssetById = cache(async (id: string): Promise<MediaAsset | null> => {
    try {
        const scope = await tenantScopeOrGlobal();
        const db = await getDb();
        const rows = await db
            .select()
            .from(mediaAssets)
            .where(and(eq(mediaAssets.id, id), tenantWhere(mediaAssets.vendorId, scope)))
            .limit(1);
        const row = rows[0] ?? null;

        return row ? mapMediaAsset(row) : null;
    } catch (error) {
        const fallback = mockMediaAssets.find((asset) => asset.id === id) ?? null;

        return handleDataFailure(error, fallback);
    }
});

export const getSlides = cache(async (): Promise<SlideAsset[]> => {
    try {
        const scope = await tenantScopeOrGlobal();
        const db = await getDb();
        const rows = await db
            .select()
            .from(slideAssets)
            .where(tenantWhere(slideAssets.vendorId, scope))
            .orderBy(desc(slideAssets.updatedAt));

        return rows.map(mapSlide);
    } catch (error) {
        return handleDataFailure(error, mockSlideAssets);
    }
});

export async function getAuditEvents(
    input: {
        action?: string;
        entityType?: string;
        limit?: number;
    } = {},
): Promise<AuditEvent[]> {
    try {
        const scope = await tenantScopeOrGlobal();
        const db = await getDb();
        const limit = Math.min(Math.max(input.limit ?? 100, 1), 250);

        const conditions = [];

        if (scope?.kind === 'vendor') {
            conditions.push(eq(auditLog.vendorId, scope.vendorId));
        }

        if (input.action) {
            conditions.push(eq(auditLog.action, input.action));
        }

        if (input.entityType) {
            conditions.push(eq(auditLog.entityType, input.entityType));
        }

        const rows = await db
            .select()
            .from(auditLog)
            .where(conditions.length ? and(...conditions) : undefined)
            .orderBy(desc(auditLog.createdAt))
            .limit(limit);

        return rows.map((row) => mapAuditEventFromDrizzle(row));
    } catch (error) {
        return handleDataFailure(error, []);
    }
}

function mapAuditEventFromDrizzle(row: AuditLogRow): AuditEvent {
    return mapAuditEvent({
        id: row.id,
        actor: row.actor,
        action: row.action,
        entity_type: row.entityType,
        entity_id: row.entityId,
        metadata: row.metadata,
        created_at: row.createdAt,
    });
}

type MediaAssetSummaryRow = Pick<
    MediaAssetRow,
    | 'id'
    | 'vendorId'
    | 'title'
    | 'status'
    | 'assetType'
    | 'mediaKind'
    | 'durationSeconds'
    | 'createdAt'
>;

function mapMediaAssetSummary(row: MediaAssetSummaryRow): MediaAssetSummary {
    return {
        id: row.id,
        vendorId: row.vendorId,
        title: row.title,
        status: row.status as MediaAsset['status'],
        assetType: row.assetType as MediaAsset['assetType'],
        mediaKind: row.mediaKind as MediaAsset['mediaKind'],
        durationSeconds: row.durationSeconds ?? null,
        createdAt: row.createdAt,
    };
}

function mapMediaAsset(row: MediaAssetRow): MediaAsset {
    return {
        id: row.id,
        vendorId: row.vendorId,
        title: row.title,
        description: row.description ?? null,
        sourceType: row.sourceType as MediaAsset['sourceType'],
        mediaKind: row.mediaKind as MediaAsset['mediaKind'],
        assetType: row.assetType as MediaAsset['assetType'],
        url: row.url ?? null,
        storageBucket: row.storageBucket ?? null,
        storagePath: row.storagePath ?? null,
        thumbnailUrl: row.thumbnailUrl ?? null,
        durationSeconds: row.durationSeconds ?? null,
        status: row.status as MediaAsset['status'],
        lifecycleState: (row.lifecycleState ?? 'reviewed') as NonNullable<
            MediaAsset['lifecycleState']
        >,
        playbackReadinessStatus: (row.playbackReadinessStatus ?? 'unchecked') as NonNullable<
            MediaAsset['playbackReadinessStatus']
        >,
        playbackCheckedAt: row.playbackCheckedAt ?? null,
        playbackError: row.playbackError ?? null,
        metadata:
            typeof row.metadata === 'object' && row.metadata !== null
                ? (row.metadata as Record<string, unknown>)
                : null,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
    };
}

function mapSlide(row: SlideAssetRow): SlideAsset {
    return {
        id: row.id,
        vendorId: row.vendorId,
        title: row.title,
        slideType: row.slideType as SlideAsset['slideType'],
        content: row.content ?? null,
        imageUrl: row.imageUrl ?? null,
        htmlContent: row.htmlContent ?? null,
        templateId: row.templateId ?? null,
        defaultDurationSeconds: row.defaultDurationSeconds ?? null,
        status: row.status as SlideAsset['status'],
        metadata:
            typeof row.metadata === 'object' && row.metadata !== null
                ? (row.metadata as Record<string, unknown>)
                : null,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
    };
}
