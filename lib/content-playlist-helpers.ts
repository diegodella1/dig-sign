import type { MediaAsset } from './types';

export function isPlayablePlaylistAsset(asset: MediaAsset) {
    if (asset.status !== 'ready') {
        return false;
    }

    if (asset.mediaKind === 'image' || asset.sourceType.includes('image')) {
        return Boolean(asset.url || asset.storagePath);
    }

    return Boolean(asset.url || asset.storagePath);
}
