import { eq } from 'drizzle-orm';

import type { FallbackPolicyMode } from '../fallback-policy';
import { getDb } from '../db/client';
import { mediaAssets } from '../db/schema';
import { err, extractError, ok, type Result } from '../result';
import { isPlayableFallback } from '../scheduling/fallback';
import type { MediaAsset } from '../types';

import {
    activateFallbackCarouselSet,
    setFallbackCarouselEnabled,
} from './slides';
import { updateMediaAsset } from './assets';

type SetFallbackPolicyInput = {
    mode: FallbackPolicyMode;
    videoId?: string | undefined;
    rotationSetId?: string | undefined;
};

export async function setFallbackPolicy(input: SetFallbackPolicyInput): Promise<Result<void>> {
    try {
        if (input.mode === 'emergency_only') {
            await clearAllSilentFallbackLoops();
            const disabled = await setFallbackCarouselEnabled(false);

            if (!disabled.success) {
                return disabled;
            }

            return ok(undefined);
        }

        if (input.mode === 'silent_video') {
            const disabled = await setFallbackCarouselEnabled(false);

            if (!disabled.success) {
                return disabled;
            }

            const videoId = input.videoId?.trim();

            if (!videoId) {
                return err('Choose a silent fallback video');
            }

            const setVideo = await setSilentFallbackVideo(videoId);

            if (!setVideo.success) {
                return setVideo;
            }

            return ok(undefined);
        }

        if (input.mode === 'plate_rotation') {
            await clearAllSilentFallbackLoops();
            const setId = input.rotationSetId?.trim();

            if (!setId) {
                return err('Choose a plate rotation set');
            }

            const activated = await activateFallbackCarouselSet(setId);

            if (!activated.success) {
                return activated;
            }

            return ok(undefined);
        }

        return err('Invalid fallback policy mode');
    } catch (error) {
        return err(extractError(error));
    }
}

async function setSilentFallbackVideo(assetId: string): Promise<Result<void>> {
    const db = await getDb();
    const [asset] = await db
        .select()
        .from(mediaAssets)
        .where(eq(mediaAssets.id, assetId))
        .limit(1);

    if (!asset || !isPlayableFallback(asset as MediaAsset)) {
        return err('Selected video is not eligible for silent fallback');
    }

    const metadata =
        typeof asset.metadata === 'object' && asset.metadata !== null
            ? (asset.metadata as Record<string, unknown>)
            : {};

    return updateMediaAsset({
        id: asset.id,
        title: asset.title,
        description: asset.description ?? '',
        sourceType: asset.sourceType,
        mediaKind: asset.mediaKind,
        assetType: asset.assetType,
        url: asset.url ?? '',
        thumbnailUrl: asset.thumbnailUrl ?? '',
        ...(asset.durationSeconds ? { durationSeconds: asset.durationSeconds } : {}),
        status: asset.status,
        lifecycleState: String(metadata.lifecycle_state || asset.lifecycleState || 'reviewed'),
        orientation: String(metadata.orientation || 'auto'),
        fallbackLoop: true,
    });
}

async function clearAllSilentFallbackLoops(): Promise<Result<void>> {
    const db = await getDb();
    const rows = await db
        .select({ id: mediaAssets.id, metadata: mediaAssets.metadata })
        .from(mediaAssets);

    for (const row of rows) {
        const metadata =
            typeof row.metadata === 'object' && row.metadata !== null
                ? { ...(row.metadata as Record<string, unknown>) }
                : {};

        if (metadata.fallback_loop !== true) {
            continue;
        }

        const [asset] = await db
            .select()
            .from(mediaAssets)
            .where(eq(mediaAssets.id, row.id))
            .limit(1);

        if (!asset) {
            continue;
        }

        const assetMetadata =
            typeof asset.metadata === 'object' && asset.metadata !== null
                ? (asset.metadata as Record<string, unknown>)
                : {};

        const cleared = await updateMediaAsset({
            id: asset.id,
            title: asset.title,
            description: asset.description ?? '',
            sourceType: asset.sourceType,
            mediaKind: asset.mediaKind,
            assetType: asset.assetType,
            url: asset.url ?? '',
            thumbnailUrl: asset.thumbnailUrl ?? '',
            ...(asset.durationSeconds ? { durationSeconds: asset.durationSeconds } : {}),
            status: asset.status,
            lifecycleState: String(
                assetMetadata.lifecycle_state || asset.lifecycleState || 'reviewed',
            ),
            orientation: String(assetMetadata.orientation || 'auto'),
            fallbackLoop: false,
        });

        if (!cleared.success) {
            return cleared;
        }
    }

    return ok(undefined);
}
