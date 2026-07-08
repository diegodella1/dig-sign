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
    saveItemsAction: (formData: FormData) => Promise<void>;
};

export function ContentPlaylistItemsEditor({
    slides,
    assets,
    initialItems,
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
                    className="rounded-md bg-accent-positive px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
                >
                    {pending ? 'Saving…' : 'Save items'}
                </button>
                {message ? <p className="text-sm text-muted">{message}</p> : null}
            </div>
        </form>
    );
}
