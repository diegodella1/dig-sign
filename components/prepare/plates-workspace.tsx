'use client';

import { Archive, Eye, Plus } from 'lucide-react';
import Link from 'next/link';
import { useMemo, useState } from 'react';

import { StatusPill } from '@/components/ui/status-pill';
import { EmptyState, FormHeader } from '@/components/ui';
import { slidePreviewHref } from '@/lib/helpers/slide-preview';
import {
    filterPlatesByTab,
    parsePlateTab,
    plateTypeLabel,
    weatherDefaults,
    type PlateTab,
} from '@/lib/prepare/plate-utils';

import type { SlideAsset } from '@/lib/types';

const TABS: Array<{ id: PlateTab; label: string }> = [
    { id: 'all', label: 'All' },
    { id: 'weather', label: 'Weather' },
    { id: 'youtube', label: 'YouTube' },
    { id: 'custom', label: 'Custom' },
];

type PlatesWorkspaceProps = {
    slides: SlideAsset[];
    initialTab: string | undefined;
    archivePlate: (formData: FormData) => Promise<void>;
    addWeatherPlateAction: (formData: FormData) => Promise<void>;
    updateWeatherPlateAction: (formData: FormData) => Promise<void>;
    addYouTubePlateAction: (formData: FormData) => Promise<void>;
    addCustomPlateAction: (formData: FormData) => Promise<void>;
};

export function PlatesWorkspace({
    slides,
    initialTab,
    archivePlate,
    addWeatherPlateAction,
    updateWeatherPlateAction,
    addYouTubePlateAction,
    addCustomPlateAction,
}: PlatesWorkspaceProps) {
    const tab = parsePlateTab(initialTab);
    const filtered = useMemo(() => filterPlatesByTab(slides, tab), [slides, tab]);
    const [createOpen, setCreateOpen] = useState(false);

    return (
        <div className="grid gap-5">
            <section className="flex flex-wrap items-center justify-between gap-3">
                <nav className="flex flex-wrap gap-1" aria-label="Plate types">
                    {TABS.map((entry) => (
                        <Link
                            key={entry.id}
                            href={entry.id === 'all' ? '/admin/slides' : `/admin/slides?tab=${entry.id}`}
                            aria-current={tab === entry.id ? 'page' : undefined}
                            className={[
                                'inline-flex min-h-8 items-center rounded-md px-3 text-xs font-semibold',
                                tab === entry.id
                                    ? 'bg-surface-selected-positive text-accent-positive'
                                    : 'text-muted hover:bg-panel-soft hover:text-ink',
                            ].join(' ')}
                        >
                            {entry.label}
                        </Link>
                    ))}
                </nav>
                <button
                    type="button"
                    className="btn-primary gap-2"
                    onClick={() => setCreateOpen((value) => !value)}
                >
                    <Plus size={15} aria-hidden="true" />
                    New plate
                </button>
            </section>

            {createOpen ? (
                <PlateCreatePanel
                    tab={tab}
                    addWeatherPlateAction={addWeatherPlateAction}
                    addYouTubePlateAction={addYouTubePlateAction}
                    addCustomPlateAction={addCustomPlateAction}
                />
            ) : null}

            <section className="surface-panel overflow-hidden">
                {filtered.length ? (
                    filtered.map((slide) => (
                        <PlateListRow
                            key={slide.id}
                            slide={slide}
                            archivePlate={archivePlate}
                            updateWeatherPlateAction={updateWeatherPlateAction}
                        />
                    ))
                ) : (
                    <div className="p-4">
                        <EmptyState title="No plates in this view">
                            {tab === 'weather' ? (
                                'Use New plate to add a weather plate for your city.'
                            ) : tab === 'all' && !slides.filter((s) => s.status !== 'archived').length ? (
                                <>
                                    Start with a plate type via New plate, or configure{' '}
                                    <Link href="/admin/playlists" className="font-semibold underline">
                                        fallback policy
                                    </Link>
                                    .
                                </>
                            ) : (
                                'Use New plate to create one for this category.'
                            )}
                        </EmptyState>
                    </div>
                )}
            </section>

            <p className="text-center text-xs text-muted">
                Plate rotation for fallback lives in{' '}
                <Link href="/admin/playlists" className="font-semibold underline">
                    Program → Fallback
                </Link>
                .
            </p>
        </div>
    );
}

function PlateCreatePanel({
    tab,
    addWeatherPlateAction,
    addYouTubePlateAction,
    addCustomPlateAction,
}: Pick<
    PlatesWorkspaceProps,
    'addWeatherPlateAction' | 'addYouTubePlateAction' | 'addCustomPlateAction'
> & { tab: PlateTab }) {
    const [plateKind, setPlateKind] = useState<Exclude<PlateTab, 'all'>>(
        tab === 'all' ? 'weather' : tab,
    );
    const defaultKind = tab === 'all' ? plateKind : tab;

    return (
        <section className="surface-panel p-4">
            <FormHeader
                title="Create plate"
                detail="Pick a type and fill the minimum fields. Advanced options stay collapsed."
            />

            {tab === 'all' ? (
                <label className="mt-4 grid max-w-md gap-1 text-xs font-semibold text-muted">
                    Plate type
                    <select
                        value={plateKind}
                        onChange={(event) =>
                            setPlateKind(event.target.value as Exclude<PlateTab, 'all'>)
                        }
                        className="border border-line px-3 py-2 text-sm font-normal text-ink"
                    >
                        <option value="weather">Weather</option>
                        <option value="youtube">YouTube</option>
                        <option value="custom">Custom</option>
                    </select>
                </label>
            ) : null}

            {defaultKind === 'weather' ? (
                <form action={addWeatherPlateAction} className="mt-4 grid gap-3 md:grid-cols-2">
                    <input name="title" required placeholder="Plate title" className="border border-line px-3 py-2 text-sm" />
                    <input
                        name="location_name"
                        required
                        placeholder="City name"
                        className="border border-line px-3 py-2 text-sm"
                    />
                    <input
                        name="default_duration_seconds"
                        type="number"
                        min="1"
                        defaultValue="30"
                        className="border border-line px-3 py-2 text-sm"
                        aria-label="Duration seconds"
                    />
                    <select name="status" defaultValue="ready" className="border border-line px-3 py-2 text-sm">
                        <option value="ready">Ready</option>
                        <option value="draft">Draft</option>
                    </select>
                    <details className="md:col-span-2">
                        <summary className="cursor-pointer text-sm font-semibold">
                            Advanced coordinates (optional)
                        </summary>
                        <div className="mt-2 grid gap-2 md:grid-cols-2">
                            <input
                                name="lat"
                                type="number"
                                step="any"
                                defaultValue="-34.6037"
                                className="border border-line px-3 py-2 text-sm"
                            />
                            <input
                                name="lon"
                                type="number"
                                step="any"
                                defaultValue="-58.3816"
                                className="border border-line px-3 py-2 text-sm"
                            />
                        </div>
                    </details>
                    <label className="grid gap-1 text-xs font-semibold text-muted md:col-span-2">
                        YouTube background URL (optional)
                        <input
                            name="youtube_url"
                            placeholder="https://www.youtube.com/watch?v=..."
                            className="border border-line px-3 py-2 text-sm font-normal text-ink"
                        />
                        <span className="font-normal">
                            Muted live/video background. Use a watch?v= or youtu.be link. Leave empty
                            for gradient only.
                        </span>
                    </label>
                    <button className="btn-primary md:col-span-2">Create weather plate</button>
                </form>
            ) : null}

            {defaultKind === 'youtube' ? (
                <form action={addYouTubePlateAction} className="mt-4 grid gap-3 md:grid-cols-2">
                    <input name="title" required placeholder="Title" className="border border-line px-3 py-2 text-sm" />
                    <input name="youtube_url" required placeholder="YouTube URL" className="border border-line px-3 py-2 text-sm" />
                    <input
                        name="default_duration_seconds"
                        type="number"
                        min="1"
                        defaultValue="30"
                        className="border border-line px-3 py-2 text-sm"
                    />
                    <button className="btn-primary md:col-span-2">Create YouTube plate</button>
                </form>
            ) : null}

            {defaultKind === 'custom' ? (
                <form action={addCustomPlateAction} className="mt-4 grid gap-3 md:grid-cols-2">
                    <input name="title" required placeholder="Title" className="border border-line px-3 py-2 text-sm" />
                    <input name="image_url" placeholder="Image URL (optional)" className="border border-line px-3 py-2 text-sm" />
                    <textarea name="content" placeholder="Text content" className="field-input md:col-span-2" />
                    <button className="btn-primary md:col-span-2">Create custom plate</button>
                </form>
            ) : null}
        </section>
    );
}

function PlateListRow({
    slide,
    archivePlate,
    updateWeatherPlateAction,
}: {
    slide: SlideAsset;
    archivePlate: (formData: FormData) => Promise<void>;
    updateWeatherPlateAction: (formData: FormData) => Promise<void>;
}) {
    const [editing, setEditing] = useState(false);
    const category = plateTypeLabel(slide);
    const weather = weatherDefaults(slide);

    if (editing && slide.templateId === 'weather') {
        return (
            <form
                action={updateWeatherPlateAction}
                className="grid gap-3 border-b border-line p-4 md:grid-cols-2"
            >
                <input type="hidden" name="slide_id" value={slide.id} />
                <input name="title" required defaultValue={slide.title} className="border border-line px-3 py-2 text-sm" />
                <input
                    name="location_name"
                    required
                    defaultValue={weather.locationName}
                    className="border border-line px-3 py-2 text-sm"
                />
                <input name="lat" type="number" step="any" defaultValue={weather.lat} className="border border-line px-3 py-2 text-sm" />
                <input name="lon" type="number" step="any" defaultValue={weather.lon} className="border border-line px-3 py-2 text-sm" />
                <input
                    name="default_duration_seconds"
                    type="number"
                    defaultValue={slide.defaultDurationSeconds ?? 30}
                    className="border border-line px-3 py-2 text-sm"
                />
                <select name="status" defaultValue={slide.status} className="border border-line px-3 py-2 text-sm">
                    <option value="ready">Ready</option>
                    <option value="draft">Draft</option>
                    <option value="archived">Archived</option>
                </select>
                <label className="grid gap-1 text-xs font-semibold text-muted md:col-span-2">
                    YouTube background URL (optional)
                    <input
                        name="youtube_url"
                        defaultValue={weather.youtubeUrl}
                        placeholder="https://www.youtube.com/watch?v=..."
                        className="border border-line px-3 py-2 text-sm font-normal text-ink"
                    />
                    <span className="font-normal">
                        Muted live/video background. Use a watch?v= or youtu.be link. Clear to use
                        gradient only.
                    </span>
                </label>
                <div className="flex gap-2 md:col-span-2">
                    <button className="btn-primary">Save</button>
                    <button type="button" className="btn-secondary" onClick={() => setEditing(false)}>
                        Cancel
                    </button>
                </div>
            </form>
        );
    }

    return (
        <div className="grid gap-3 border-b border-line p-4 md:grid-cols-[minmax(0,1fr)_120px_180px] md:items-center">
            <div>
                <p className="font-semibold">{slide.title}</p>
                <p className="text-sm text-muted">
                    {category} · {slide.defaultDurationSeconds ?? 30}s
                </p>
            </div>
            <StatusPill status={slide.status} />
            <div className="flex flex-wrap gap-2 md:justify-end">
                <a
                    className="btn-secondary min-h-9 gap-2"
                    href={slidePreviewHref(slide.id)}
                    target="_blank"
                    rel="noreferrer"
                >
                    <Eye size={15} aria-hidden="true" />
                    Preview
                </a>
                {slide.templateId === 'weather' ? (
                    <button type="button" className="btn-secondary min-h-9" onClick={() => setEditing(true)}>
                        Edit
                    </button>
                ) : null}
                <form action={archivePlate}>
                    <input type="hidden" name="slide_id" value={slide.id} />
                    <button className="btn-secondary min-h-9 gap-2">
                        <Archive size={15} aria-hidden="true" />
                        Archive
                    </button>
                </form>
            </div>
        </div>
    );
}
