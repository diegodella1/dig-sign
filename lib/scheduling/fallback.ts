import type { MediaAsset } from '../types';

/**
 * Returns true if the asset has been tagged as a fallback-eligible item.
 *
 * An asset is tagged when:
 *   - its assetType is 'fallback' (the existing glitch-asset convention), OR
 *   - metadata.fallback_tagged is explicitly true (set via setAssetFallbackTagged).
 *
 * Status, playability, and mediaKind are NOT checked here — use
 * isPlayableFallback when you need the full eligibility gate.
 */
export function isFallbackTagged(asset: MediaAsset): boolean {
    return asset.assetType === 'fallback' || asset.metadata?.fallback_tagged === true;
}

export function isFallbackCandidate(asset: MediaAsset): boolean {
    return (
        asset.status === 'ready' &&
        asset.mediaKind === 'video' &&
        (asset.assetType === 'fallback' || asset.metadata?.fallback_loop === true)
    );
}

export function isPlayableFallback(asset: MediaAsset): boolean {
    if (!isFallbackCandidate(asset)) {
        return false;
    }

    return Boolean(asset.url || asset.storagePath || asset.vimeoId);
}

export function findFallbackCandidate(assets: MediaAsset[]): MediaAsset | null {
    return assets.find(isFallbackCandidate) ?? null;
}

export function findPlayableFallback(assets: MediaAsset[]): MediaAsset | null {
    const designated = assets.find(
        (asset) => isPlayableFallback(asset) && asset.metadata?.fallback_loop === true,
    );

    return designated ?? assets.find(isPlayableFallback) ?? null;
}
