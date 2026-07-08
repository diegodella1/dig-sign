import { isPlayablePlaylistAsset } from '@/lib/content-playlist-helpers';
import type { MediaAsset, SlideAsset } from '@/lib/types';

export type LoopEditorCard = {
    key: string;
    kind: 'slide' | 'asset';
    id: string;
    slideId?: string;
    assetId?: string;
    durationSeconds: number;
};

export function sortSlidesByTitle(a: SlideAsset, b: SlideAsset) {
    return a.title.localeCompare(b.title);
}

export function sortAssetsByTitle(a: MediaAsset, b: MediaAsset) {
    return a.title.localeCompare(b.title);
}

export { isPlayablePlaylistAsset };

export function itemLabelForCard(
    card: Pick<LoopEditorCard, 'kind' | 'id'>,
    slideById: Map<string, SlideAsset>,
    assetById: Map<string, MediaAsset>,
) {
    return card.kind === 'asset' ? assetById.get(card.id)?.title : slideById.get(card.id)?.title;
}

export function countLoopCards(cards: LoopEditorCard[], kind: LoopEditorCard['kind'], id: string) {
    return cards.filter((card) => card.kind === kind && card.id === id).length;
}

export function cardsFromPlaylistItems(
    items: Array<{
        assetId: string | null;
        slideId: string | null;
        durationSeconds: number | null;
    }>,
    slideById: Map<string, SlideAsset>,
    assetById: Map<string, MediaAsset>,
): LoopEditorCard[] {
    const cards: LoopEditorCard[] = [];

    for (const [index, item] of items.entries()) {
        if (item.assetId && assetById.has(item.assetId)) {
            const asset = assetById.get(item.assetId)!;

            cards.push({
                key: `asset-${item.assetId}-${index}`,
                kind: 'asset',
                id: item.assetId,
                assetId: item.assetId,
                durationSeconds:
                    item.durationSeconds ??
                    asset.durationSeconds ??
                    (asset.mediaKind === 'image' ? 15 : 30),
            });
            continue;
        }

        if (item.slideId && slideById.has(item.slideId)) {
            const slide = slideById.get(item.slideId)!;

            cards.push({
                key: `slide-${item.slideId}-${index}`,
                kind: 'slide',
                id: item.slideId,
                slideId: item.slideId,
                durationSeconds: item.durationSeconds ?? slide.defaultDurationSeconds ?? 30,
            });
        }
    }

    return cards;
}
