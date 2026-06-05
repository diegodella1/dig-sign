import { eq, or, sql } from 'drizzle-orm';

import { getDb } from './db/client';
import { integrationSettings, mediaAssets } from './db/schema';
import { getGlobalFallbackCarousel } from './fallback-carousel';
import { isFallbackTagged, isPlayableFallback } from './scheduling/fallback';

import type { MediaAsset } from './types';
import type { FallbackCarouselSet } from './fallback-carousel';

export type ActiveFallback = {
    kind: 'asset' | 'carousel';
    id: string;
};

export type FallbackOption =
    | {
          kind: 'asset';
          id: string;
          title: string;
          durationSeconds: number | null;
          thumbnailUrl: string | null;
          isActive: boolean;
      }
    | {
          kind: 'carousel';
          id: string;
          title: string;
          cardCount: number;
          isActive: boolean;
      };

const ACTIVE_FALLBACK_PROVIDER = 'fallback_active';

export async function getActiveFallback(): Promise<ActiveFallback | null> {
    try {
        const db = await getDb();
        const [row] = await db
            .select({ publicConfig: integrationSettings.publicConfig })
            .from(integrationSettings)
            .where(eq(integrationSettings.provider, ACTIVE_FALLBACK_PROVIDER))
            .limit(1);

        return parseActiveFallback(row?.publicConfig);
    } catch {
        return null;
    }
}

function parseActiveFallback(value: unknown): ActiveFallback | null {
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
        return null;
    }

    const record = value as Record<string, unknown>;
    const kind = record.kind;
    const id = record.id;

    if (kind !== 'asset' && kind !== 'carousel') {
        return null;
    }

    if (typeof id !== 'string' || !id) {
        return null;
    }

    return { kind, id };
}

export async function listFallbackOptions(): Promise<FallbackOption[]> {
    const [assetRows, carousel, active] = await Promise.all([
        fetchTaggedAssets(),
        getGlobalFallbackCarousel(),
        getActiveFallback(),
    ]);

    const assetOptions: FallbackOption[] = assetRows.map((asset) => ({
        kind: 'asset',
        id: asset.id,
        title: String(asset.title),
        durationSeconds: typeof asset.durationSeconds === 'number' ? asset.durationSeconds : null,
        thumbnailUrl: typeof asset.thumbnailUrl === 'string' ? asset.thumbnailUrl : null,
        isActive: active?.kind === 'asset' && active.id === asset.id,
    }));

    const carouselOptions: FallbackOption[] = (carousel?.sets ?? []).map(
        (set: FallbackCarouselSet) => ({
            kind: 'carousel',
            id: set.id,
            title: set.name,
            cardCount: set.cards.length,
            isActive: active?.kind === 'carousel' && active.id === set.id,
        }),
    );

    return [...assetOptions, ...carouselOptions];
}

async function fetchTaggedAssets(): Promise<MediaAsset[]> {
    const db = await getDb();
    const rows = await db
        .select({
            id: mediaAssets.id,
            title: mediaAssets.title,
            description: mediaAssets.description,
            sourceType: mediaAssets.sourceType,
            mediaKind: mediaAssets.mediaKind,
            assetType: mediaAssets.assetType,
            url: mediaAssets.url,
            storageBucket: mediaAssets.storageBucket,
            storagePath: mediaAssets.storagePath,
            thumbnailUrl: mediaAssets.thumbnailUrl,
            durationSeconds: mediaAssets.durationSeconds,
            status: mediaAssets.status,
            vimeoId: mediaAssets.vimeoId,
            vimeoUri: mediaAssets.vimeoUri,
            vimeoPrivacy: mediaAssets.vimeoPrivacy,
            vimeoEmbedStatus: mediaAssets.vimeoEmbedStatus,
            metadata: mediaAssets.metadata,
            playbackReadinessStatus: mediaAssets.playbackReadinessStatus,
            playbackCheckedAt: mediaAssets.playbackCheckedAt,
            playbackError: mediaAssets.playbackError,
            lifecycleState: mediaAssets.lifecycleState,
            createdAt: mediaAssets.createdAt,
            updatedAt: mediaAssets.updatedAt,
        })
        .from(mediaAssets)
        .where(
            or(
                eq(mediaAssets.assetType, 'fallback'),
                eq(sql`json_extract(${mediaAssets.metadata}, '$.fallback_tagged')`, sql`1`),
            ),
        );

    return rows
        .filter((row) => {
            const asset = row as MediaAsset;

            return isFallbackTagged(asset) && isPlayableFallback(asset);
        })
        .map((row) => row as unknown as MediaAsset);
}
