'use client';

import { Archive, Eye, Plus } from 'lucide-react';
import Link from 'next/link';
import { useMemo, useState } from 'react';

import { GuestLineupEditor } from '@/components/prepare/guest-lineup-editor';
import { StatusPill } from '@/components/ui/status-pill';
import { EmptyState, FormHeader } from '@/components/ui';
import { slidePreviewHref } from '@/lib/helpers/slide-preview';
import {
    filterPlatesByTab,
    guestIdsFromMetadata,
    parsePlateTab,
    plateTypeLabel,
    SYSTEM_SLIDE_PRESETS,
    weatherDefaults,
    type PlateTab,
} from '@/lib/prepare/plate-utils';
import { SLIDE_TEMPLATES } from '@/lib/slides/registry';

import type { Guest, SlideAsset } from '@/lib/types';

const TABS: Array<{ id: PlateTab; label: string }> = [
    { id: 'all', label: 'All' },
    { id: 'weather', label: 'Weather' },
    { id: 'data', label: 'Data' },
    { id: 'guests', label: 'Guests' },
    { id: 'youtube', label: 'YouTube' },
    { id: 'custom', label: 'Custom' },
];

type PlatesWorkspaceProps = {
    slides: SlideAsset[];
    guests: Guest[];
    initialTab: string | undefined;
    addDataPlate: (formData: FormData) => Promise<void>;
    addAllDataPlates: () => Promise<void>;
    archivePlate: (formData: FormData) => Promise<void>;
    addWeatherPlateAction: (formData: FormData) => Promise<void>;
    updateWeatherPlateAction: (formData: FormData) => Promise<void>;
    addYouTubePlateAction: (formData: FormData) => Promise<void>;
    addCustomPlateAction: (formData: FormData) => Promise<void>;
    addGuestLineupPlateAction: (formData: FormData) => Promise<void>;
    updateGuestLineupPlateAction: (formData: FormData) => Promise<void>;
    archiveGuestLineupPlateAction: (formData: FormData) => Promise<void>;
};

export function PlatesWorkspace({
    slides,
    guests,
    initialTab,
    addDataPlate,
    addAllDataPlates,
    archivePlate,
    addWeatherPlateAction,
    updateWeatherPlateAction,
    addYouTubePlateAction,
    addCustomPlateAction,
    addGuestLineupPlateAction,
    updateGuestLineupPlateAction,
    archiveGuestLineupPlateAction,
}: PlatesWorkspaceProps) {
    const tab = parsePlateTab(initialTab);
    const filtered = useMemo(() => filterPlatesByTab(slides, tab), [slides, tab]);
    const [createOpen, setCreateOpen] = useState(false);
    const missingDataCount = SYSTEM_SLIDE_PRESETS.filter(
        (preset) =>
            !slides.some(
                (slide) => slide.templateId === preset.templateId && slide.status !== 'archived',
            ),
    ).length;

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

            {tab === 'data' && missingDataCount ? (
                <section className="surface-panel flex flex-wrap items-center justify-between gap-3 p-4">
                    <p className="text-sm text-muted">
                        {missingDataCount} data plate template{missingDataCount === 1 ? '' : 's'}{' '}
                        not created yet.
                    </p>
                    <form action={addAllDataPlates}>
                        <button className="btn-secondary">Create missing data plates</button>
                    </form>
                </section>
            ) : null}

            {createOpen ? (
                <PlateCreatePanel
                    tab={tab}
                    guests={guests}
                    addDataPlate={addDataPlate}
                    addWeatherPlateAction={addWeatherPlateAction}
                    addYouTubePlateAction={addYouTubePlateAction}
                    addCustomPlateAction={addCustomPlateAction}
                    addGuestLineupPlateAction={addGuestLineupPlateAction}
                />
            ) : null}

            <section className="surface-panel overflow-hidden">
                {filtered.length ? (
                    filtered.map((slide) => (
                        <PlateListRow
                            key={slide.id}
                            slide={slide}
                            guests={guests}
                            archivePlate={archivePlate}
                            updateWeatherPlateAction={updateWeatherPlateAction}
                            updateGuestLineupPlateAction={updateGuestLineupPlateAction}
                            archiveGuestLineupPlateAction={archiveGuestLineupPlateAction}
                        />
                    ))
                ) : (
                    <div className="p-4">
                        <EmptyState title="No plates in this view">
                            {tab === 'guests' ? (
                                <>
                                    Create a guest lineup plate or add people in{' '}
                                    <Link href="/admin/guests" className="font-semibold underline">
                                        People
                                    </Link>
                                    .
                                </>
                            ) : tab === 'weather' ? (
                                'Use New plate to add a weather plate for your city.'
                            ) : tab === 'all' && !slides.filter((s) => s.status !== 'archived').length ? (
                                <>
                                    Start with a plate type via New plate, or configure{' '}
                                    <Link href="/admin/prepare/gap-fill" className="font-semibold underline">
                                        gap fill
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
                Gap fill carousel lives in{' '}
                <Link href="/admin/prepare/gap-fill" className="font-semibold underline">
                    Prepare → Gap fill
                </Link>
                .
            </p>
        </div>
    );
}

function PlateCreatePanel({
    tab,
    guests,
    addDataPlate,
    addWeatherPlateAction,
    addYouTubePlateAction,
    addCustomPlateAction,
    addGuestLineupPlateAction,
}: Pick<
    PlatesWorkspaceProps,
    | 'addDataPlate'
    | 'addWeatherPlateAction'
    | 'addYouTubePlateAction'
    | 'addCustomPlateAction'
    | 'addGuestLineupPlateAction'
> & { tab: PlateTab; guests: Guest[] }) {
    const [plateKind, setPlateKind] = useState<Exclude<PlateTab, 'all'>>(
        tab === 'all' ? 'data' : tab === 'guests' ? 'guests' : tab,
    );
    const defaultKind = tab === 'all' ? plateKind : tab === 'guests' ? 'guests' : tab;

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
                        <option value="data">Data / markets</option>
                        <option value="guests">Guest lineup</option>
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
                    <button className="btn-primary md:col-span-2">Create weather plate</button>
                </form>
            ) : null}

            {defaultKind === 'data' ? (
                <form action={addDataPlate} className="mt-4 grid gap-3 md:grid-cols-2">
                    <select name="template_id" required className="field-input md:col-span-2">
                        {SLIDE_TEMPLATES.filter(
                            (t) => t.id !== 'weather' && t.id !== 'guest-lineup',
                        ).map((template) => (
                            <option key={template.id} value={template.id}>
                                {template.label}
                            </option>
                        ))}
                    </select>
                    <input name="title" placeholder="Title (optional)" className="border border-line px-3 py-2 text-sm" />
                    <input
                        name="default_duration_seconds"
                        type="number"
                        min="1"
                        defaultValue="30"
                        className="border border-line px-3 py-2 text-sm"
                    />
                    <button className="btn-primary md:col-span-2">Create data plate</button>
                </form>
            ) : null}

            {defaultKind === 'guests' ? (
                <form action={addGuestLineupPlateAction} className="mt-4 grid gap-3">
                    <input name="title" required placeholder="Lineup title" className="border border-line px-3 py-2 text-sm" />
                    <input
                        name="default_duration_seconds"
                        type="number"
                        min="1"
                        defaultValue="30"
                        className="border border-line px-3 py-2 text-sm"
                    />
                    <GuestLineupEditor guests={guests.filter((g) => g.status === 'ready')} />
                    <button className="btn-primary">Create guest lineup plate</button>
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
    guests,
    archivePlate,
    updateWeatherPlateAction,
    updateGuestLineupPlateAction,
    archiveGuestLineupPlateAction,
}: {
    slide: SlideAsset;
    guests: Guest[];
    archivePlate: (formData: FormData) => Promise<void>;
    updateWeatherPlateAction: (formData: FormData) => Promise<void>;
    updateGuestLineupPlateAction: (formData: FormData) => Promise<void>;
    archiveGuestLineupPlateAction: (formData: FormData) => Promise<void>;
}) {
    const [editing, setEditing] = useState(false);
    const category = plateTypeLabel(slide);
    const weather = weatherDefaults(slide);
    const guestIds = guestIdsFromMetadata(slide.metadata);

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
                <div className="flex gap-2 md:col-span-2">
                    <button className="btn-primary">Save</button>
                    <button type="button" className="btn-secondary" onClick={() => setEditing(false)}>
                        Cancel
                    </button>
                </div>
            </form>
        );
    }

    if (editing && slide.templateId === 'guest-lineup') {
        return (
            <form action={updateGuestLineupPlateAction} className="grid gap-3 border-b border-line p-4">
                <input type="hidden" name="slide_id" value={slide.id} />
                <input name="title" required defaultValue={slide.title} className="border border-line px-3 py-2 text-sm" />
                <input
                    name="default_duration_seconds"
                    type="number"
                    defaultValue={slide.defaultDurationSeconds ?? 30}
                    className="border border-line px-3 py-2 text-sm"
                />
                <GuestLineupEditor
                    guests={guests.filter((g) => g.status !== 'archived')}
                    initialSelectedIds={guestIds}
                />
                <div className="flex gap-2">
                    <button className="btn-primary">Save lineup</button>
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
                    {slide.templateId === 'guest-lineup'
                        ? ` · ${guestIds.length} guest${guestIds.length === 1 ? '' : 's'}`
                        : ''}
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
                {slide.templateId === 'weather' || slide.templateId === 'guest-lineup' ? (
                    <button type="button" className="btn-secondary min-h-9" onClick={() => setEditing(true)}>
                        Edit
                    </button>
                ) : null}
                <form
                    action={
                        slide.templateId === 'guest-lineup'
                            ? archiveGuestLineupPlateAction
                            : archivePlate
                    }
                >
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
