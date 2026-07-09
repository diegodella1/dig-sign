'use client';

import { useMemo, useState, useTransition } from 'react';

import { LoopEditor } from '@/components/prepare/loop-editor';
import {
    cardsFromPlaylistItems,
    sortAssetsByTitle,
    sortSlidesByTitle,
    type LoopEditorCard,
} from '@/components/prepare/loop-editor-utils';

import type { MediaAsset, SlideAsset } from '@/lib/types';

type PlaylistItemSeed = {
    assetId: string | null;
    slideId: string | null;
    durationSeconds: number | null;
};

type Props = {
    slides: SlideAsset[];
    assets: MediaAsset[];
    initialItems: PlaylistItemSeed[];
    orientation: 'horizontal' | 'vertical';
    saveItemsAction: (formData: FormData) => Promise<void>;
};

export function ContentPlaylistItemsEditor({
    slides,
    assets,
    initialItems,
    orientation,
    saveItemsAction,
}: Props) {
    const readySlides = useMemo(
        () => slides.filter((slide) => slide.status === 'ready').sort(sortSlidesByTitle),
        [slides],
    );
    const readyAssets = useMemo(
        () =>
            assets
                .filter((asset) => asset.status === 'ready' && asset.assetType !== 'music')
                .sort(sortAssetsByTitle),
        [assets],
    );
    const slideById = useMemo(
        () => new Map(readySlides.map((slide) => [slide.id, slide])),
        [readySlides],
    );
    const assetById = useMemo(
        () => new Map(readyAssets.map((asset) => [asset.id, asset])),
        [readyAssets],
    );
    const [cards, setCards] = useState<LoopEditorCard[]>(() =>
        cardsFromPlaylistItems(initialItems, slideById, assetById),
    );
    const orientationWarnings = useMemo(
        () =>
            cards
                .map((card) => (card.kind === 'asset' ? assetById.get(card.id) : null))
                .filter(
                    (asset): asset is MediaAsset =>
                        Boolean(asset) &&
                        assetOrientation(asset!) !== 'auto' &&
                        assetOrientation(asset!) !== orientation,
                ),
        [assetById, cards, orientation],
    );
    const [message, setMessage] = useState('');
    const [pending, startTransition] = useTransition();

    function handleSubmit(formData: FormData) {
        setMessage('');
        startTransition(async () => {
            try {
                await saveItemsAction(formData);
                setMessage('Playlist items saved.');
            } catch (error) {
                setMessage(error instanceof Error ? error.message : 'Save failed');
            }
        });
    }

    return (
        <form action={handleSubmit} className="mt-3 grid gap-4">
            <section className="grid gap-4 lg:grid-cols-[260px_1fr]">
                <div className="grid place-items-center border-2 border-line bg-panel-soft p-4">
                    <div
                        className={[
                            'grid place-items-center border-2 border-line bg-surface-selected-positive p-3 text-center shadow-[4px_4px_0_#1a1a1a]',
                            orientation === 'vertical'
                                ? 'aspect-[9/16] h-72 max-h-[55vh]'
                                : 'aspect-video w-full',
                        ].join(' ')}
                    >
                        <div>
                            <p className="font-headline text-xs font-bold uppercase text-muted">
                                Preview canvas
                            </p>
                            <p className="mt-2 font-display text-2xl font-bold uppercase">
                                {orientation === 'vertical' ? '9:16' : '16:9'}
                            </p>
                            <p className="mt-2 text-sm font-semibold text-muted">
                                {cards.length} item{cards.length === 1 ? '' : 's'}
                            </p>
                        </div>
                    </div>
                </div>
                <div className="border-2 border-line bg-surface p-4">
                    <p className="font-headline text-sm font-bold uppercase">Canvas checks</p>
                    {orientationWarnings.length ? (
                        <div className="mt-3 border-2 border-warn-line bg-warn-soft p-3 text-sm text-warn-strong">
                            <p className="font-semibold">
                                Orientation mismatch: these assets may crop or letterbox.
                            </p>
                            <ul className="mt-2 list-disc pl-5">
                                {orientationWarnings.slice(0, 5).map((asset) => (
                                    <li key={asset.id}>{asset.title}</li>
                                ))}
                            </ul>
                        </div>
                    ) : (
                        <p className="mt-3 text-sm text-muted">
                            Assets are compatible with this playlist orientation or set to auto.
                        </p>
                    )}
                </div>
            </section>
            <LoopEditor
                slides={slides}
                assets={readyAssets}
                cards={cards}
                onCardsChange={setCards}
            />

            <div className="flex flex-wrap items-center gap-3">
                <button
                    type="submit"
                    disabled={!cards.length || pending}
                    className="btn-primary disabled:opacity-50"
                >
                    {pending ? 'Saving...' : 'Guardar draft'}
                </button>
                {message ? <p className="text-sm text-muted">{message}</p> : null}
            </div>
        </form>
    );
}

function assetOrientation(asset: MediaAsset) {
    return String(
        asset.metadata?.orientation ||
            (asset.metadata?.presentation === 'vertical_blur' ? 'vertical' : 'auto'),
    );
}
