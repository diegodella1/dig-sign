'use client';

import {
    closestCenter,
    DndContext,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    type DragEndEvent,
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    useSortable,
    verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Plus, Trash2 } from 'lucide-react';
import { useMemo, useRef } from 'react';

import {
    countLoopCards,
    isPlayableFallbackCarouselAsset,
    itemLabelForCard,
    sortAssetsByTitle,
    sortSlidesByTitle,
    type LoopEditorCard,
} from '@/components/prepare/loop-editor-utils';

import type { MediaAsset, SlideAsset } from '@/lib/types';

export type LoopEditorMode = 'gap-fill' | 'scheduled';

type LoopEditorProps = {
    mode: LoopEditorMode;
    slides: SlideAsset[];
    assets?: MediaAsset[];
    cards: LoopEditorCard[];
    onCardsChange: (cards: LoopEditorCard[]) => void;
    /** Hidden field names for form submission */
    fieldNames?: {
        kinds: string;
        ids: string;
        durations: string;
        slideIds?: string;
    };
};

const DEFAULT_FIELD_NAMES = {
    kinds: 'item_kinds',
    ids: 'item_ids',
    durations: 'durations',
    slideIds: 'slide_ids',
};

export function LoopEditor({
    mode,
    slides,
    assets = [],
    cards,
    onCardsChange,
    fieldNames = DEFAULT_FIELD_NAMES,
}: LoopEditorProps) {
    const readySlides = useMemo(
        () => slides.filter((slide) => slide.status === 'ready').sort(sortSlidesByTitle),
        [slides],
    );
    const slideById = useMemo(
        () => new Map(readySlides.map((slide) => [slide.id, slide])),
        [readySlides],
    );
    const readyVideoAssets = useMemo(
        () => assets.filter(isPlayableFallbackCarouselAsset).sort(sortAssetsByTitle),
        [assets],
    );
    const assetById = useMemo(
        () => new Map(readyVideoAssets.map((asset) => [asset.id, asset])),
        [readyVideoAssets],
    );
    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
    );
    const totalDuration = cards.reduce((total, card) => total + card.durationSeconds, 0);
    const showVideoPicker = mode === 'gap-fill';
    const cardKeyRef = useRef(0);

    function nextCardKey(prefix: string, id: string) {
        cardKeyRef.current += 1;

        return `${prefix}-${id}-${cardKeyRef.current}-${cards.length}`;
    }

    function addSlide(slide: SlideAsset) {
        onCardsChange([
            ...cards,
            {
                key: nextCardKey('slide', slide.id),
                slideId: slide.id,
                id: slide.id,
                kind: 'slide',
                durationSeconds: slide.defaultDurationSeconds ?? 30,
            },
        ]);
    }

    function addAsset(asset: MediaAsset) {
        onCardsChange([
            ...cards,
            {
                key: nextCardKey('asset', asset.id),
                kind: 'asset',
                id: asset.id,
                assetId: asset.id,
                durationSeconds: asset.durationSeconds ?? 30,
            },
        ]);
    }

    function updateDuration(index: number, durationSeconds: number) {
        onCardsChange(
            cards.map((card, cardIndex) =>
                cardIndex === index
                    ? { ...card, durationSeconds: Math.max(1, Math.round(durationSeconds || 1)) }
                    : card,
            ),
        );
    }

    function updateSlideId(index: number, slideId: string) {
        const slide = slideById.get(slideId);
        onCardsChange(
            cards.map((card, cardIndex) =>
                cardIndex === index
                    ? {
                          ...card,
                          id: slideId,
                          slideId,
                          durationSeconds:
                              slide?.defaultDurationSeconds ?? card.durationSeconds ?? 30,
                      }
                    : card,
            ),
        );
    }

    function removeCard(cardKey: string) {
        onCardsChange(cards.filter((item) => item.key !== cardKey));
    }

    function onDragEnd(event: DragEndEvent) {
        const { active, over } = event;

        if (!over || active.id === over.id) {
            return;
        }
        const oldIndex = cards.findIndex((card) => card.key === active.id);
        const newIndex = cards.findIndex((card) => card.key === over.id);

        if (oldIndex >= 0 && newIndex >= 0) {
            onCardsChange(arrayMove(cards, oldIndex, newIndex));
        }
    }

    return (
        <div className="grid gap-4">
            {cards.map((card) => (
                <div key={`${card.key}-hidden`}>
                    <input type="hidden" name={fieldNames.kinds} value={card.kind} />
                    <input type="hidden" name={fieldNames.ids} value={card.id} />
                    <input type="hidden" name={fieldNames.durations} value={String(card.durationSeconds)} />
                    {fieldNames.slideIds ? (
                        <input type="hidden" name={fieldNames.slideIds} value={card.id} />
                    ) : null}
                </div>
            ))}

            {mode === 'gap-fill' ? (
                <>
                    <div className="grid gap-2">
                        <p className="text-xs font-semibold uppercase text-muted">Ready plates</p>
                        <div className="grid max-h-72 gap-2 overflow-auto pr-1 md:grid-cols-2">
                            {readySlides.map((slide) => {
                                const count = countLoopCards(cards, 'slide', slide.id);

                                return (
                                    <div
                                        key={slide.id}
                                        className="grid min-h-12 grid-cols-[minmax(0,1fr)_auto] items-center gap-2 rounded-md border border-line bg-surface px-3 py-2 text-sm"
                                    >
                                        <span className="min-w-0">
                                            <span className="block truncate font-semibold">
                                                {slide.title}
                                            </span>
                                            <span className="block text-xs text-muted">
                                                {slide.templateId ?? slide.slideType} ·{' '}
                                                {slide.defaultDurationSeconds ?? 30}s
                                                {count ? ` · ${count}x in loop` : ''}
                                            </span>
                                        </span>
                                        <button
                                            type="button"
                                            className="btn-secondary min-h-9 gap-1 px-2"
                                            onClick={() => addSlide(slide)}
                                            aria-label={`Add ${slide.title} to loop`}
                                        >
                                            <Plus size={14} aria-hidden="true" />
                                            Add
                                        </button>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {showVideoPicker ? (
                        <div className="grid gap-2">
                            <p className="text-xs font-semibold uppercase text-muted">
                                Promo/ad videos
                            </p>
                            <div className="grid max-h-56 gap-2 overflow-auto pr-1 md:grid-cols-2">
                                {readyVideoAssets.map((asset) => {
                                    const count = countLoopCards(cards, 'asset', asset.id);

                                    return (
                                        <div
                                            key={asset.id}
                                            className="grid min-h-12 grid-cols-[minmax(0,1fr)_auto] items-center gap-2 rounded-md border border-line bg-surface px-3 py-2 text-sm"
                                        >
                                            <span className="min-w-0">
                                                <span className="block truncate font-semibold">
                                                    {asset.title}
                                                </span>
                                                <span className="block text-xs text-muted">
                                                    {asset.assetType} · {asset.durationSeconds ?? 30}s
                                                    {count ? ` · ${count}x in loop` : ''}
                                                </span>
                                            </span>
                                            <button
                                                type="button"
                                                className="btn-secondary min-h-9 gap-1 px-2"
                                                onClick={() => addAsset(asset)}
                                                aria-label={`Add ${asset.title} to loop`}
                                            >
                                                <Plus size={14} aria-hidden="true" />
                                                Add
                                            </button>
                                        </div>
                                    );
                                })}
                                {!readyVideoAssets.length ? (
                                    <p className="rounded-md border border-line bg-panel-soft px-3 py-2 text-sm text-muted md:col-span-2">
                                        No ready promo/ad videos yet.
                                    </p>
                                ) : null}
                            </div>
                        </div>
                    ) : null}
                </>
            ) : null}

            <div className="grid gap-2">
                <div className="flex items-center justify-between gap-3">
                    <p className="text-xs font-semibold uppercase text-muted">Loop order</p>
                    <p className="text-xs text-muted">
                        {cards.length} items · {totalDuration}s
                    </p>
                </div>

                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
                    <SortableContext
                        items={cards.map((card) => card.key)}
                        strategy={verticalListSortingStrategy}
                    >
                        {cards.map((card, index) => (
                            <SortableLoopRow
                                key={card.key}
                                card={card}
                                index={index}
                                mode={mode}
                                readySlides={readySlides}
                                slideById={slideById}
                                assetById={assetById}
                                onDurationChange={updateDuration}
                                onSlideChange={updateSlideId}
                                onRemove={() => removeCard(card.key)}
                                canRemove={mode === 'scheduled' ? cards.length > 1 : true}
                            />
                        ))}
                    </SortableContext>
                </DndContext>

                {!cards.length ? (
                    <p className="rounded-md border border-warn-line bg-warn-soft px-3 py-2 text-sm text-warn-strong">
                        {mode === 'gap-fill'
                            ? 'Select at least one ready plate or promo/ad video.'
                            : 'Add at least one ready plate.'}
                    </p>
                ) : null}
            </div>
        </div>
    );
}

function SortableLoopRow({
    card,
    index,
    mode,
    readySlides,
    slideById,
    assetById,
    onDurationChange,
    onSlideChange,
    onRemove,
    canRemove,
}: {
    card: LoopEditorCard;
    index: number;
    mode: LoopEditorMode;
    readySlides: SlideAsset[];
    slideById: Map<string, SlideAsset>;
    assetById: Map<string, MediaAsset>;
    onDurationChange: (index: number, durationSeconds: number) => void;
    onSlideChange: (index: number, slideId: string) => void;
    onRemove: () => void;
    canRemove: boolean;
}) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
        id: card.key,
    });
    const title = itemLabelForCard(card, slideById, assetById) ?? 'Missing item';

    return (
        <div
            ref={setNodeRef}
            style={{ transform: CSS.Transform.toString(transform), transition }}
            className={[
                'grid gap-2 rounded-md border border-line bg-panel-soft p-2 md:grid-cols-[40px_minmax(0,1fr)_96px_40px]',
                isDragging ? 'opacity-80 shadow-md' : '',
            ].join(' ')}
        >
            <button
                type="button"
                className="grid size-10 place-items-center self-center rounded-md border border-line bg-surface"
                aria-label="Drag to reorder"
                {...attributes}
                {...listeners}
            >
                <GripVertical size={15} aria-hidden="true" />
            </button>

            <div className="min-w-0 self-center">
                {mode === 'scheduled' ? (
                    <label className="grid gap-1 text-xs font-semibold text-muted">
                        Plate
                        <select
                            value={card.id}
                            onChange={(event) => onSlideChange(index, event.target.value)}
                            className="border border-line px-2 py-1 text-sm font-normal text-ink"
                        >
                            {readySlides.map((slide) => (
                                <option key={slide.id} value={slide.id}>
                                    {slide.title}
                                </option>
                            ))}
                        </select>
                    </label>
                ) : (
                    <>
                        <p className="truncate text-sm font-semibold">{title}</p>
                        <p className="text-xs text-muted">
                            {card.kind === 'asset' ? 'Video' : 'Plate'} · position {index + 1}
                        </p>
                    </>
                )}
            </div>

            <label className="grid gap-1 text-xs font-semibold text-muted">
                Seconds
                <input
                    type="number"
                    min="1"
                    value={card.durationSeconds}
                    onChange={(event) => onDurationChange(index, Number(event.target.value))}
                    className="border border-line px-2 py-1 text-sm font-normal text-ink"
                />
            </label>

            <button
                type="button"
                className="grid size-10 place-items-center self-end rounded-md border border-line"
                onClick={onRemove}
                disabled={!canRemove}
                aria-label="Remove item from loop"
            >
                <Trash2 size={15} aria-hidden="true" />
            </button>
        </div>
    );
}
