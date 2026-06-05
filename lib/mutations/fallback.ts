import { revalidatePath } from 'next/cache';
import { eq } from 'drizzle-orm';

import { auditedMutation } from '../audit/audit';
import { getDb } from '../db/client';
import { integrationSettings, mediaAssets } from '../db/schema';
import { getGlobalFallbackCarousel } from '../fallback-carousel';
import { getActiveFallback, type ActiveFallback } from '../fallback-active';
import { isFallbackTagged, isPlayableFallback } from '../scheduling/fallback';
import { err, extractError, ok, type Result } from '../result';

import type { MediaAsset } from '../types';

const ACTIVE_FALLBACK_PROVIDER = 'fallback_active';

const REVALIDATE_PATHS = [
    '/admin/assets',
    '/admin/output',
    '/admin/slides',
    '/live',
    '/output/live',
] as const;

export async function setActiveFallback(input: ActiveFallback): Promise<Result<void>> {
    try {
        if (input.kind !== 'asset' && input.kind !== 'carousel') {
            return err('Invalid fallback kind');
        }

        if (!input.id) {
            return err('Fallback id is required');
        }

        const validation = await validateFallbackTarget(input);

        if (!validation.success) {
            return validation;
        }

        const db = await getDb();
        const now = new Date().toISOString();
        const previous = await getActiveFallback();
        const publicConfig: Record<string, unknown> = { kind: input.kind, id: input.id };

        await auditedMutation(
            {
                action: 'fallback_active.set',
                entityType: 'integration_settings',
                entityId: ACTIVE_FALLBACK_PROVIDER,
                previous: previous ? { kind: previous.kind, id: previous.id } : null,
                next: { kind: input.kind, id: input.id },
            },
            async () => {
                await db
                    .insert(integrationSettings)
                    .values({
                        provider: ACTIVE_FALLBACK_PROVIDER,
                        publicConfig,
                        status: 'connected',
                        updatedAt: now,
                    })
                    .onConflictDoUpdate({
                        target: integrationSettings.provider,
                        set: {
                            publicConfig,
                            status: 'connected',
                            updatedAt: now,
                        },
                    });
            },
        );

        for (const path of REVALIDATE_PATHS) {
            revalidatePath(path);
        }

        return ok(undefined);
    } catch (error) {
        return err(extractError(error));
    }
}

export async function clearActiveFallback(): Promise<Result<void>> {
    try {
        const db = await getDb();
        const now = new Date().toISOString();

        await auditedMutation(
            {
                action: 'fallback_active.cleared',
                entityType: 'integration_settings',
                entityId: ACTIVE_FALLBACK_PROVIDER,
                next: {},
            },
            async () => {
                await db
                    .insert(integrationSettings)
                    .values({
                        provider: ACTIVE_FALLBACK_PROVIDER,
                        publicConfig: {},
                        status: 'unknown',
                        updatedAt: now,
                    })
                    .onConflictDoUpdate({
                        target: integrationSettings.provider,
                        set: {
                            publicConfig: {},
                            status: 'unknown',
                            updatedAt: now,
                        },
                    });
            },
        );

        for (const path of REVALIDATE_PATHS) {
            revalidatePath(path);
        }

        return ok(undefined);
    } catch (error) {
        return err(extractError(error));
    }
}

async function validateFallbackTarget(input: ActiveFallback): Promise<Result<void>> {
    if (input.kind === 'asset') {
        return validateAssetTarget(input.id);
    }

    return validateCarouselTarget(input.id);
}

async function validateAssetTarget(id: string): Promise<Result<void>> {
    const db = await getDb();
    const [row] = await db
        .select({
            id: mediaAssets.id,
            status: mediaAssets.status,
            mediaKind: mediaAssets.mediaKind,
            assetType: mediaAssets.assetType,
            url: mediaAssets.url,
            storagePath: mediaAssets.storagePath,
            vimeoId: mediaAssets.vimeoId,
            metadata: mediaAssets.metadata,
        })
        .from(mediaAssets)
        .where(eq(mediaAssets.id, id))
        .limit(1);

    if (!row) {
        return err('Asset not found');
    }

    const asset = row as MediaAsset;

    if (!isFallbackTagged(asset)) {
        return err('Asset is not tagged as fallback');
    }

    if (!isPlayableFallback(asset)) {
        return err('Asset is not playable (must be ready video with a playback source)');
    }

    return ok(undefined);
}

async function validateCarouselTarget(setId: string): Promise<Result<void>> {
    const carousel = await getGlobalFallbackCarousel();

    if (!carousel) {
        return err('No fallback carousel configured');
    }

    const setExists = carousel.sets.some((set) => set.id === setId);

    if (!setExists) {
        return err('Carousel set not found');
    }

    return ok(undefined);
}
