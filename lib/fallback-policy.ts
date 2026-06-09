import {
    type FallbackCarousel,
    isPlayableFallbackCarouselAsset,
} from './fallback-carousel';
import { getGlobalFallbackCarousel } from './fallback-carousel';
import { getAssets, getSlides } from './data';
import { findPlayableFallback, isPlayableFallback } from './scheduling/fallback';

import type { MediaAsset, ScheduleBundle, SlideAsset } from './types';

export async function loadFallbackPolicyStatus(
    bundle?: Pick<ScheduleBundle, 'mediaAssets' | 'slideAssets'>,
) {
    const [carousel, mediaAssets, slideAssets] = await Promise.all([
        getGlobalFallbackCarousel(),
        bundle ? Promise.resolve(bundle.mediaAssets) : getAssets(),
        bundle ? Promise.resolve(bundle.slideAssets) : getSlides(),
    ]);

    return resolveFallbackPolicyStatus({
        mediaAssets,
        slideAssets,
        carousel,
    });
}

export type FallbackPolicyMode = 'silent_video' | 'plate_rotation' | 'emergency_only';

export type FallbackPolicyStatus = {
    mode: FallbackPolicyMode;
    ready: boolean;
    label: string;
    detail?: string;
};

export type FallbackPolicyContext = {
    mediaAssets: MediaAsset[];
    slideAssets: SlideAsset[];
    carousel: FallbackCarousel | null;
};

export function listSilentVideoCandidates(mediaAssets: MediaAsset[]) {
    return mediaAssets.filter((asset) => isPlayableFallback(asset));
}

export function inferFallbackPolicyMode(context: FallbackPolicyContext): FallbackPolicyMode {
    const { carousel } = context;

    if (carousel?.enabled) {
        return 'plate_rotation';
    }

    if (findPlayableFallback(context.mediaAssets)) {
        return 'silent_video';
    }

    return 'emergency_only';
}

export function resolveFallbackPolicyStatus(context: FallbackPolicyContext): FallbackPolicyStatus {
    const mode = inferFallbackPolicyMode(context);

    if (mode === 'emergency_only') {
        return {
            mode,
            ready: true,
            label: 'Emergency slate only',
            detail: 'Shows the built-in emergency slate when nothing else is available.',
        };
    }

    if (mode === 'plate_rotation') {
        const setId = context.carousel?.activeSetId ?? context.carousel?.sets[0]?.id ?? null;
        const set =
            context.carousel?.sets.find((entry) => entry.id === setId) ??
            context.carousel?.sets[0] ??
            null;
        const playableCards = countPlayableCarouselCards(set?.cards ?? [], context);

        if (!context.carousel?.enabled) {
            return {
                mode,
                ready: false,
                label: 'Plate rotation',
                detail: 'Plate rotation is disabled. Choose a rotation or switch policy mode.',
            };
        }

        if (!set || playableCards === 0) {
            return {
                mode,
                ready: false,
                label: 'Plate rotation',
                detail: 'Add at least one ready plate or video to the rotation.',
            };
        }

        return {
            mode,
            ready: true,
            label: `Plate rotation · ${set.name}`,
        };
    }

    const video = findPlayableFallback(context.mediaAssets);

    if (!video) {
        return {
            mode,
            ready: false,
            label: 'Silent video loop',
            detail: 'Mark a ready video as eligible for silent fallback in Media.',
        };
    }

    return {
        mode,
        ready: true,
        label: `Silent video · ${video.title}`,
    };
}

function countPlayableCarouselCards(
    cards: FallbackCarousel['cards'],
    context: Pick<FallbackPolicyContext, 'mediaAssets' | 'slideAssets'>,
) {
    const slideById = new Map(
        context.slideAssets
            .filter((slide) => slide.status === 'ready')
            .map((slide) => [slide.id, slide]),
    );
    const assetById = new Map(
        context.mediaAssets
            .filter((asset) => isPlayableFallbackCarouselAsset(asset))
            .map((asset) => [asset.id, asset]),
    );

    return cards.filter((card) =>
        card.kind === 'asset' ? assetById.has(card.id) : slideById.has(card.id),
    ).length;
}
