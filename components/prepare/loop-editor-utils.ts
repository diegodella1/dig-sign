import type { FallbackCarouselCard, FallbackCarouselSet } from '@/lib/fallback-carousel';
import { isPlayableFallbackCarouselAsset } from '@/lib/fallback-carousel';
import type { MediaAsset, SlideAsset } from '@/lib/types';

export type LoopEditorCard = FallbackCarouselCard & {
    key: string;
};

export function sortSlidesByTitle(a: SlideAsset, b: SlideAsset) {
    return a.title.localeCompare(b.title);
}

export function sortAssetsByTitle(a: MediaAsset, b: MediaAsset) {
    return a.title.localeCompare(b.title);
}

export { isPlayableFallbackCarouselAsset };

export function cardsFromCarouselSet(
    set: FallbackCarouselSet | null,
    readySlides: SlideAsset[],
    slideById: Map<string, SlideAsset>,
    assetById: Map<string, MediaAsset>,
): LoopEditorCard[] {
    const sourceCards = set?.cards.length
        ? set.cards
        : readySlides.slice(0, 3).map((slide) => ({
              kind: 'slide' as const,
              id: slide.id,
              slideId: slide.id,
              durationSeconds: slide.defaultDurationSeconds ?? 30,
          }));

    return sourceCards
        .filter((card) => (card.kind === 'asset' ? assetById.has(card.id) : slideById.has(card.id)))
        .map((card, index) => ({
            ...card,
            key: `${card.kind}-${card.id}-${index}`,
        }));
}

export function initialScheduledCards(readySlides: SlideAsset[]): LoopEditorCard[] {
    const first = readySlides[0];

    if (!first) {
        return [];
    }

    return [
        {
            key: 'row-1',
            kind: 'slide',
            id: first.id,
            slideId: first.id,
            durationSeconds: first.defaultDurationSeconds ?? 30,
        },
    ];
}

export function itemLabelForCard(
    card: FallbackCarouselCard,
    slideById: Map<string, SlideAsset>,
    assetById: Map<string, MediaAsset>,
) {
    return card.kind === 'asset'
        ? assetById.get(card.id)?.title
        : slideById.get(card.id)?.title;
}

export function countLoopCards(cards: LoopEditorCard[], kind: FallbackCarouselCard['kind'], id: string) {
    return cards.filter((card) => card.kind === kind && card.id === id).length;
}
