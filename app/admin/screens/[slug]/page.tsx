import { revalidatePath } from 'next/cache';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import { programSubNav } from '@/components/broadcast/mode-sub-nav-items';
import { AdminShell } from '@/components/admin/admin-shell';
import { FormHeader, Notice } from '@/components/ui';
import {
    isPlayableContentPlaylist,
    listAssignmentsForScreen,
    listContentPlaylists,
} from '@/lib/content-playlists';
import {
    assignPlaylistToScreen,
    removePlaylistAssignment,
    updateSignageScreen,
} from '@/lib/mutations';
import { listLayoutPresets, getScreenBySlug } from '@/lib/screens';

import type { WeekdayKey } from '@/lib/content-playlists';

export const dynamic = 'force-dynamic';

const WEEKDAYS: Array<{ key: WeekdayKey; label: string }> = [
    { key: 'mon', label: 'Mon' },
    { key: 'tue', label: 'Tue' },
    { key: 'wed', label: 'Wed' },
    { key: 'thu', label: 'Thu' },
    { key: 'fri', label: 'Fri' },
    { key: 'sat', label: 'Sat' },
    { key: 'sun', label: 'Sun' },
];

export default async function ScreenDetailPage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params;
    const screen = await getScreenBySlug(slug);

    if (!screen) {
        notFound();
    }

    const [playlists, assignments, presets] = await Promise.all([
        listContentPlaylists(),
        listAssignmentsForScreen(screen.id),
        listLayoutPresets(),
    ]);
    const playablePlaylists = playlists.filter(isPlayableContentPlaylist);
    const compatiblePlaylists = playablePlaylists.filter(
        (playlist) => playlist.orientation === screen.orientation,
    );
    const playlistById = new Map(playlists.map((playlist) => [playlist.id, playlist]));

    async function saveScreenAction(formData: FormData) {
        'use server';
        const result = await updateSignageScreen({
            id: String(formData.get('id')),
            name: String(formData.get('name') || ''),
            slug: String(formData.get('slug') || ''),
            layoutPresetId: String(formData.get('layout_preset_id') || '') || null,
            fallbackPlaylistId: String(formData.get('fallback_playlist_id') || '') || null,
            timezone: String(formData.get('timezone') || '') || null,
            orientation:
                String(formData.get('orientation') || 'horizontal') === 'vertical'
                    ? 'vertical'
                    : 'horizontal',
        });

        if (!result.success) {
            throw new Error(result.error);
        }

        revalidatePath('/admin/screens');
        revalidatePath(`/admin/screens/${slug}`);
        revalidatePath(`/output/live/${slug}`);
    }

    async function assignPlaylistAction(formData: FormData) {
        'use server';
        const weekdays = WEEKDAYS.filter((day) => formData.get(`weekday_${day.key}`) === 'on').map(
            (day) => day.key,
        );
        const result = await assignPlaylistToScreen({
            screenId: screen!.id,
            playlistId: String(formData.get('playlist_id') || ''),
            startDate: String(formData.get('start_date') || '') || null,
            endDate: String(formData.get('end_date') || '') || null,
            weekdays,
            priority: Number(formData.get('priority') || 0) || 0,
        });

        if (!result.success) {
            throw new Error(result.error);
        }

        revalidatePath(`/admin/screens/${slug}`);
    }

    async function deleteAssignmentAction(formData: FormData) {
        'use server';
        const result = await removePlaylistAssignment(String(formData.get('assignment_id') || ''));

        if (!result.success) {
            throw new Error(result.error);
        }

        revalidatePath(`/admin/screens/${slug}`);
    }

    return (
        <AdminShell title={screen.name} subNav={programSubNav}>
            <Notice tone="info" title="Player URL">
                <code>/output/live/{screen.slug}</code>
            </Notice>

            <section className="mt-4 rounded-md border border-line bg-surface-elevated-2 p-4">
                <FormHeader
                    title="Screen settings"
                    detail="Slug controls the player URL path. Orientation controls the output canvas."
                />
                <form action={saveScreenAction} className="mt-3 grid gap-3 md:grid-cols-2">
                    <input type="hidden" name="id" value={screen.id} />
                    <label className="grid gap-1 text-sm">
                        <span className="text-muted">Name</span>
                        <input
                            name="name"
                            defaultValue={screen.name}
                            className="rounded-md border border-line bg-surface px-3 py-2"
                        />
                    </label>
                    <label className="grid gap-1 text-sm">
                        <span className="text-muted">Slug</span>
                        <input
                            name="slug"
                            defaultValue={screen.slug}
                            className="rounded-md border border-line bg-surface px-3 py-2"
                        />
                    </label>
                    <label className="grid gap-1 text-sm">
                        <span className="text-muted">Layout preset</span>
                        <select
                            name="layout_preset_id"
                            defaultValue={screen.layoutPresetId ?? ''}
                            className="rounded-md border border-line bg-surface px-3 py-2"
                        >
                            <option value="">None</option>
                            {presets.map((preset) => (
                                <option key={preset.id} value={preset.id}>
                                    {preset.name}
                                </option>
                            ))}
                        </select>
                    </label>
                    <label className="grid gap-1 text-sm">
                        <span className="text-muted">Fallback playlist</span>
                        <select
                            name="fallback_playlist_id"
                            defaultValue={screen.fallbackPlaylistId ?? ''}
                            className="rounded-md border border-line bg-surface px-3 py-2"
                        >
                            <option value="">None</option>
                            {compatiblePlaylists.map((playlist) => (
                                <option key={playlist.id} value={playlist.id}>
                                    {playlist.name} ({playlist.itemCount} items)
                                </option>
                            ))}
                        </select>
                        {!compatiblePlaylists.length ? (
                            <span className="text-xs text-muted">
                                No approved {screen.orientation} playlists are available.
                            </span>
                        ) : null}
                    </label>
                    <label className="grid gap-1 text-sm md:col-span-2">
                        <span className="text-muted">Timezone</span>
                        <input
                            name="timezone"
                            defaultValue={screen.timezone}
                            className="rounded-md border border-line bg-surface px-3 py-2"
                        />
                    </label>
                    <label className="grid gap-1 text-sm md:col-span-2">
                        <span className="text-muted">Orientation</span>
                        <select
                            name="orientation"
                            defaultValue={screen.orientation}
                            className="rounded-md border border-line bg-surface px-3 py-2"
                        >
                            <option value="horizontal">Horizontal 16:9</option>
                            <option value="vertical">Vertical 9:16</option>
                        </select>
                    </label>
                    <div className="md:col-span-2">
                        <button
                            type="submit"
                            className="rounded-md bg-accent-positive px-4 py-2 text-sm font-semibold text-white"
                        >
                            Save
                        </button>
                    </div>
                </form>
            </section>

            <section className="mt-6 rounded-md border border-line bg-surface-elevated-2 p-4">
                <FormHeader
                    title="Day assignments"
                    detail="Higher priority wins when multiple rules match today."
                />
                <form action={assignPlaylistAction} className="mt-3 grid gap-3 md:grid-cols-2">
                    <label className="grid gap-1 text-sm md:col-span-2">
                        <span className="text-muted">Playlist</span>
                        <select
                            name="playlist_id"
                            required
                            className="rounded-md border border-line bg-surface px-3 py-2"
                        >
                            <option value="">Choose playlist</option>
                            {compatiblePlaylists.map((playlist) => (
                                <option key={playlist.id} value={playlist.id}>
                                    {playlist.name} ({playlist.itemCount} items)
                                </option>
                            ))}
                        </select>
                        {!compatiblePlaylists.length ? (
                            <span className="text-xs text-muted">
                                No approved {screen.orientation} playlists yet. Create and submit
                                one in Playlists.
                            </span>
                        ) : null}
                    </label>
                    <label className="grid gap-1 text-sm">
                        <span className="text-muted">Start date</span>
                        <input
                            type="date"
                            name="start_date"
                            className="rounded-md border border-line bg-surface px-3 py-2"
                        />
                    </label>
                    <label className="grid gap-1 text-sm">
                        <span className="text-muted">End date</span>
                        <input
                            type="date"
                            name="end_date"
                            className="rounded-md border border-line bg-surface px-3 py-2"
                        />
                    </label>
                    <label className="grid gap-1 text-sm">
                        <span className="text-muted">Priority</span>
                        <input
                            type="number"
                            name="priority"
                            defaultValue={0}
                            className="rounded-md border border-line bg-surface px-3 py-2"
                        />
                    </label>
                    <fieldset className="grid gap-2 text-sm">
                        <legend className="text-muted">Weekdays (empty = every day)</legend>
                        <div className="flex flex-wrap gap-3">
                            {WEEKDAYS.map((day) => (
                                <label key={day.key} className="inline-flex items-center gap-1">
                                    <input type="checkbox" name={`weekday_${day.key}`} />
                                    {day.label}
                                </label>
                            ))}
                        </div>
                    </fieldset>
                    <div className="md:col-span-2">
                        <button
                            type="submit"
                            className="rounded-md border border-line px-4 py-2 text-sm font-semibold"
                        >
                            Add assignment
                        </button>
                    </div>
                </form>

                <ul className="mt-4 divide-y divide-line rounded-md border border-line">
                    {assignments.map((assignment) => {
                        const playlist = playlistById.get(assignment.playlistId);

                        return (
                            <li
                                key={assignment.id}
                                className="flex flex-wrap items-center justify-between gap-3 px-4 py-3"
                            >
                                <div>
                                    <p className="font-semibold">
                                        {playlist?.name ?? assignment.playlistId}
                                    </p>
                                    <p className="text-sm text-muted">
                                        {assignment.startDate ?? '…'} → {assignment.endDate ?? '…'}{' '}
                                        · priority {assignment.priority}
                                        {assignment.weekdays.length
                                            ? ` · ${assignment.weekdays.join(', ')}`
                                            : ' · all days'}
                                    </p>
                                </div>
                                <form action={deleteAssignmentAction}>
                                    <input
                                        type="hidden"
                                        name="assignment_id"
                                        value={assignment.id}
                                    />
                                    <button type="submit" className="text-sm text-danger">
                                        Remove
                                    </button>
                                </form>
                            </li>
                        );
                    })}
                </ul>
            </section>

            <p className="mt-4 text-sm">
                <Link href="/admin/screens" className="underline">
                    Back to screens
                </Link>
            </p>
        </AdminShell>
    );
}
