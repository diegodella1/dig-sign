'use client';

import { Check, Play, Plus } from 'lucide-react';
import { useMemo, useState } from 'react';

import { LoopEditor } from '@/components/prepare/loop-editor';
import {
    cardsFromCarouselSet,
    sortAssetsByTitle,
    sortSlidesByTitle,
} from '@/components/prepare/loop-editor-utils';

import type {
    FallbackCarousel,
    FallbackCarouselSet,
} from '@/lib/fallback-carousel';
import type { MediaAsset, SlideAsset } from '@/lib/types';

type FallbackSetsPanelProps = {
    slides: SlideAsset[];
    assets: MediaAsset[];
    carousel: FallbackCarousel | null;
    saveSet: (formData: FormData) => Promise<void>;
    activateSet: (formData: FormData) => Promise<void>;
    deleteSet: (formData: FormData) => Promise<void>;
    /** When true, hides outer section chrome (used inside Gap fill page) */
    embedded?: boolean;
};

export function FallbackSetsPanel({
    slides,
    assets,
    carousel,
    saveSet,
    activateSet,
    deleteSet,
    embedded = false,
}: FallbackSetsPanelProps) {
    const readySlides = useMemo(
        () => slides.filter((slide) => slide.status === 'ready').sort(sortSlidesByTitle),
        [slides],
    );
    const slideById = useMemo(
        () => new Map(readySlides.map((slide) => [slide.id, slide])),
        [readySlides],
    );
    const readyVideoAssets = useMemo(
        () => assets.filter((asset) => asset.status === 'ready').sort(sortAssetsByTitle),
        [assets],
    );
    const assetById = useMemo(
        () => new Map(readyVideoAssets.map((asset) => [asset.id, asset])),
        [readyVideoAssets],
    );
    const activeSet =
        carousel?.sets.find((set) => set.id === carousel.activeSetId) ?? carousel?.sets[0] ?? null;
    const [setName, setSetName] = useState(activeSet?.name ?? 'Fallback loop');
    const [editingSetId, setEditingSetId] = useState<string | null>(activeSet?.id ?? null);
    const [cards, setCards] = useState(() =>
        cardsFromCarouselSet(activeSet, readySlides, slideById, assetById),
    );

    function loadSet(set: FallbackCarouselSet) {
        setSetName(set.name);
        setEditingSetId(set.id);
        setCards(cardsFromCarouselSet(set, readySlides, slideById, assetById));
    }

    const content = (
        <div className="grid gap-0 lg:grid-cols-[minmax(0,1fr)_minmax(360px,440px)]">
            <form
                action={saveSet}
                className="grid gap-4 border-b border-line p-4 lg:border-b-0 lg:border-r"
            >
                <input type="hidden" name="set_id" value={editingSetId ?? ''} />

                <label className="grid gap-1 text-xs font-semibold text-muted">
                    Set name
                    <input
                        name="name"
                        required
                        value={setName}
                        onChange={(event) => setSetName(event.target.value)}
                        className="border border-line px-3 py-2 text-sm font-normal text-ink"
                    />
                </label>

                <LoopEditor
                    mode="gap-fill"
                    slides={slides}
                    assets={assets}
                    cards={cards}
                    onCardsChange={setCards}
                />

                <button className="btn-primary w-fit gap-2" disabled={!cards.length}>
                    <Plus size={15} aria-hidden="true" />
                    Save and activate set
                </button>
            </form>

            <div className="grid content-start gap-3 p-4">
                <p className="text-xs font-semibold uppercase text-muted">Saved sets</p>
                {carousel?.sets.length ? (
                    carousel.sets.map((set) => (
                        <div key={set.id} className="rounded-md border border-line bg-surface p-3">
                            <div className="flex items-start justify-between gap-3">
                                <div className="min-w-0">
                                    <p className="truncate font-semibold">{set.name}</p>
                                    <p className="text-xs text-muted">
                                        {set.cards.length} items ·{' '}
                                        {set.cards.reduce(
                                            (total, card) => total + card.durationSeconds,
                                            0,
                                        )}
                                        s
                                    </p>
                                </div>
                                {set.id === carousel.activeSetId ? (
                                    <span className="inline-flex items-center gap-1 rounded-md border border-ok-line bg-ok-soft px-2 py-1 text-xs font-semibold text-ok-strong">
                                        <Check size={13} aria-hidden="true" />
                                        Active
                                    </span>
                                ) : null}
                            </div>
                            <div className="mt-3 flex flex-wrap gap-2">
                                <button
                                    type="button"
                                    className="btn-secondary min-h-9"
                                    onClick={() => loadSet(set)}
                                >
                                    Edit
                                </button>
                                <form action={activateSet}>
                                    <input type="hidden" name="set_id" value={set.id} />
                                    <button className="btn-secondary min-h-9 gap-2">
                                        <Play size={14} aria-hidden="true" />
                                        Set active
                                    </button>
                                </form>
                                <form action={deleteSet}>
                                    <input type="hidden" name="set_id" value={set.id} />
                                    <button className="btn-secondary min-h-9">Delete</button>
                                </form>
                            </div>
                        </div>
                    ))
                ) : (
                    <p className="rounded-md border border-line bg-panel-soft px-3 py-2 text-sm text-muted">
                        No saved fallback sets yet.
                    </p>
                )}
            </div>
        </div>
    );

    if (embedded) {
        return content;
    }

    return (
        <section className="surface-panel mb-5 overflow-hidden">
            <div className="border-b border-line p-4">
                <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                    <div>
                        <h2 className="text-sm font-semibold">Fallback sets</h2>
                        <p className="mt-1 max-w-3xl text-sm text-muted">
                            Add ready plates and promo/ad videos in any order, then save one named
                            fallback loop as active.
                        </p>
                    </div>
                    <div className="rounded-md border border-line bg-panel-soft px-3 py-2 text-xs font-semibold text-muted">
                        Active:{' '}
                        <span className="text-ink">
                            {activeSet ? activeSet.name : 'No fallback set'}
                        </span>
                    </div>
                </div>
            </div>
            {content}
        </section>
    );
}
