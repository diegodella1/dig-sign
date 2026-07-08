import { revalidatePath } from 'next/cache';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import { programSubNav } from '@/components/broadcast/mode-sub-nav-items';
import { AdminShell } from '@/components/admin/admin-shell';
import { ContentPlaylistItemsEditor } from '@/components/signage/content-playlist-items-editor';
import { FormHeader } from '@/components/ui';
import { getAssets, getSlides } from '@/lib/data';
import { getContentPlaylist } from '@/lib/content-playlists';
import { saveSignagePlaylistItems, updateSignagePlaylist } from '@/lib/mutations';

export const dynamic = 'force-dynamic';

function parsePlaylistItemsFromForm(formData: FormData) {
    const kinds = formData.getAll('item_kinds').map(String);
    const ids = formData.getAll('item_ids').map(String);
    const durations = formData.getAll('durations').map(String);

    return kinds.map((kind, index) => ({
        assetId: kind === 'asset' ? (ids[index] ?? null) : null,
        slideId: kind === 'slide' ? (ids[index] ?? null) : null,
        durationSeconds: Number(durations[index]) || null,
    }));
}

export default async function PlaylistDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const [playlist, assets, slides] = await Promise.all([
        getContentPlaylist(id),
        getAssets(),
        getSlides(),
    ]);

    if (!playlist) {
        notFound();
    }

    async function saveMetaAction(formData: FormData) {
        'use server';
        const result = await updateSignagePlaylist({
            id,
            name: String(formData.get('name') || ''),
            status: String(formData.get('status') || 'draft') as 'draft' | 'ready' | 'archived',
            orientation:
                String(formData.get('orientation') || 'horizontal') === 'vertical'
                    ? 'vertical'
                    : 'horizontal',
        });

        if (!result.success) {
            throw new Error(result.error);
        }

        revalidatePath('/admin/playlists');
        revalidatePath(`/admin/playlists/${id}`);
        revalidatePath('/output/live/main');
    }

    async function saveItemsAction(formData: FormData) {
        'use server';
        const result = await saveSignagePlaylistItems({
            playlistId: id,
            items: parsePlaylistItemsFromForm(formData),
        });

        if (!result.success) {
            throw new Error(result.error);
        }

        revalidatePath(`/admin/playlists/${id}`);
        revalidatePath('/output/live/main');
    }

    const initialItems = playlist.items.map((item) => ({
        assetId: item.assetId,
        slideId: item.slideId,
        durationSeconds: item.durationSeconds,
    }));

    return (
        <AdminShell title={playlist.name} subNav={programSubNav}>
            <section className="rounded-md border border-line bg-surface-elevated-2 p-4">
                <FormHeader
                    title="Playlist settings"
                    detail="Only ready playlists are used on output."
                />
                <form action={saveMetaAction} className="mt-3 flex flex-wrap gap-3">
                    <input
                        name="name"
                        defaultValue={playlist.name}
                        className="min-w-[16rem] flex-1 rounded-md border border-line bg-surface px-3 py-2"
                    />
                    <select
                        name="status"
                        defaultValue={playlist.status}
                        className="rounded-md border border-line bg-surface px-3 py-2"
                    >
                        <option value="draft">Draft</option>
                        <option value="ready">Ready</option>
                        <option value="archived">Archived</option>
                    </select>
                    <select
                        name="orientation"
                        defaultValue={playlist.orientation}
                        className="rounded-md border border-line bg-surface px-3 py-2"
                    >
                        <option value="horizontal">Horizontal 16:9</option>
                        <option value="vertical">Vertical 9:16</option>
                    </select>
                    <button
                        type="submit"
                        className="rounded-md bg-accent-positive px-4 py-2 text-sm font-semibold text-white"
                    >
                        Save
                    </button>
                </form>
            </section>

            <section className="mt-6 rounded-md border border-line bg-surface-elevated-2 p-4">
                <FormHeader
                    title="Items"
                    detail="Drag to reorder. Add plates and media, then set how long each card stays on screen."
                />
                <ContentPlaylistItemsEditor
                    slides={slides}
                    assets={assets}
                    initialItems={initialItems}
                    saveItemsAction={saveItemsAction}
                />
            </section>

            <p className="mt-4 text-sm">
                <Link href="/admin/playlists" className="underline">
                    Back to playlists
                </Link>
            </p>
        </AdminShell>
    );
}
