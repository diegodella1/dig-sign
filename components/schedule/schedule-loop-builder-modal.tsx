'use client';

import { Plus, X } from 'lucide-react';
import Link from 'next/link';
import { useMemo, useRef, useState } from 'react';

import { LoopEditor } from '@/components/prepare/loop-editor';
import {
    initialScheduledCards,
    sortSlidesByTitle,
    type LoopEditorCard,
} from '@/components/prepare/loop-editor-utils';

import type { ScheduleBundle } from '@/lib/types';

import { DEFAULT_MANUAL_DURATION } from './helpers';

type LoopBuilderModalProps = {
    schedule: ScheduleBundle;
    action: (formData: FormData) => Promise<void>;
    open: boolean;
    onClose: () => void;
};

export function LoopBuilderModal({ schedule, action, open, onClose }: LoopBuilderModalProps) {
    const readySlides = useMemo(
        () =>
            schedule.slideAssets
                .filter((slide) => slide.status === 'ready')
                .sort(sortSlidesByTitle),
        [schedule.slideAssets],
    );
    const cardKeyRef = useRef(0);
    const [cards, setCards] = useState<LoopEditorCard[]>(() =>
        initialScheduledCards(readySlides).map((card) => ({
            ...card,
            durationSeconds:
                readySlides.find((slide) => slide.id === card.id)?.defaultDurationSeconds ??
                DEFAULT_MANUAL_DURATION,
        })),
    );

    if (!open) {
        return null;
    }

    function addRow() {
        const first = readySlides[0];

        if (!first) {
            return;
        }

        cardKeyRef.current += 1;

        setCards((current) => [
            ...current,
            {
                key: `row-${first.id}-${cardKeyRef.current}`,
                kind: 'slide',
                id: first.id,
                slideId: first.id,
                durationSeconds: first.defaultDurationSeconds ?? DEFAULT_MANUAL_DURATION,
            },
        ]);
    }

    return (
        <div
            className="fixed inset-0 z-[90] grid place-items-center bg-black/60 p-3 backdrop-blur-sm sm:p-6"
            role="presentation"
            onMouseDown={(event) => {
                if (event.target === event.currentTarget) {
                    onClose();
                }
            }}
        >
            <div
                className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-lg border border-line bg-surface shadow-xl"
                role="dialog"
                aria-modal="true"
                aria-labelledby="loop-builder-title"
            >
                <div className="flex items-start justify-between gap-3 border-b border-line px-4 py-3">
                    <div>
                        <p className="eyebrow">Timed loop</p>
                        <h2 id="loop-builder-title" className="text-lg font-semibold">
                            Fill range with plates
                        </h2>
                        <p className="mt-1 text-sm text-muted">
                            Create a plate loop for a clock window on this day. Global fallback
                            policy lives in{' '}
                            <Link href="/admin/program/fallback" className="font-semibold underline">
                                Program → Fallback
                            </Link>
                            .
                        </p>
                    </div>
                    <button
                        type="button"
                        className="grid size-9 place-items-center rounded-md border border-line"
                        onClick={onClose}
                        aria-label="Close loop builder"
                    >
                        <X size={16} aria-hidden="true" />
                    </button>
                </div>

                <form action={action} className="grid min-h-0 flex-1 gap-4 overflow-y-auto p-4">
                    <div className="grid gap-3 md:grid-cols-[1fr_1fr_auto]">
                        <label className="grid gap-1 text-xs font-semibold text-muted">
                            Clock start (24 h)
                            <input
                                name="start_time"
                                required
                                defaultValue="00:00:00"
                                className="border border-line px-3 py-2 text-sm font-normal text-ink"
                            />
                        </label>
                        <label className="grid gap-1 text-xs font-semibold text-muted">
                            Clock end (24 h)
                            <input
                                name="end_time"
                                required
                                defaultValue="01:00:00"
                                className="border border-line px-3 py-2 text-sm font-normal text-ink"
                            />
                        </label>
                        <label className="flex min-h-10 items-center gap-2 self-end rounded-md border border-line bg-panel-soft px-3 text-sm font-medium">
                            <input name="replace_window" type="checkbox" />
                            Replace window
                        </label>
                    </div>

                    <LoopEditor
                        mode="scheduled"
                        slides={schedule.slideAssets}
                        cards={cards}
                        onCardsChange={setCards}
                        fieldNames={{
                            kinds: 'item_kinds',
                            ids: 'item_ids',
                            durations: 'durations',
                            slideIds: 'slide_ids',
                        }}
                    />

                    {!readySlides.length ? (
                        <p className="rounded-md border border-warn-line bg-warn-soft px-3 py-2 text-sm text-warn-strong">
                            No ready plates yet. Create ready plates in Prepare → Plates first.
                        </p>
                    ) : null}

                    <div className="flex flex-wrap items-center gap-2 border-t border-line pt-3">
                        <button
                            type="button"
                            className="btn-secondary gap-2"
                            onClick={addRow}
                            disabled={!readySlides.length}
                        >
                            <Plus size={15} aria-hidden="true" />
                            Add card
                        </button>
                        <button
                            className="btn-primary"
                            name="loop_mode"
                            value="scheduled"
                            disabled={!readySlides.length || !cards.length}
                        >
                            Create timed loop
                        </button>
                        <button type="button" className="btn-secondary" onClick={onClose}>
                            Cancel
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
