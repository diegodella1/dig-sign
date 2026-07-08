import { revalidatePath } from 'next/cache';
import Link from 'next/link';

import { programSubNav } from '@/components/broadcast/mode-sub-nav-items';
import { AdminShell } from '@/components/admin/admin-shell';
import { EmptyState, FormHeader } from '@/components/ui';
import { listContentPlaylists } from '@/lib/content-playlists';
import { createSignagePlaylist } from '@/lib/mutations';

export const dynamic = 'force-dynamic';

export default async function PlaylistsPage() {
    const playlists = await listContentPlaylists();

    async function createPlaylistAction(formData: FormData) {
        'use server';
        const result = await createSignagePlaylist({
            name: String(formData.get('name') || ''),
            status: 'draft',
        });

        if (!result.success) {
            throw new Error(result.error);
        }

        revalidatePath('/admin/playlists');
    }

    return (
        <AdminShell title="Playlists" subNav={programSubNav}>
            <section className="rounded-md border border-line bg-surface-elevated-2 p-4">
                <FormHeader title="New playlist" detail="Build ordered loops of slides and media." />
                <form action={createPlaylistAction} className="mt-3 flex flex-wrap gap-3">
                    <input
                        name="name"
                        required
                        placeholder="Morning loop"
                        className="min-w-[16rem] flex-1 rounded-md border border-line bg-surface px-3 py-2"
                    />
                    <button
                        type="submit"
                        className="rounded-md bg-accent-positive px-4 py-2 text-sm font-semibold text-white"
                    >
                        Create
                    </button>
                </form>
            </section>

            <section className="mt-6">
                <FormHeader title="Content playlists" detail="Mark ready before assigning to screens." />
                {!playlists.length ? (
                    <EmptyState title="No playlists yet">
                        Create a playlist to start building signage loops.
                    </EmptyState>
                ) : (
                    <ul className="mt-3 divide-y divide-line rounded-md border border-line bg-surface-elevated-2">
                        {playlists.map((playlist) => (
                            <li
                                key={playlist.id}
                                className="flex flex-wrap items-center justify-between gap-3 px-4 py-3"
                            >
                                <div>
                                    <p className="font-semibold">{playlist.name}</p>
                                    <p className="text-sm text-muted">
                                        {playlist.itemCount} items · {playlist.status}
                                    </p>
                                </div>
                                <Link
                                    href={`/admin/playlists/${playlist.id}`}
                                    className="rounded-md border border-line px-3 py-1.5 text-sm"
                                >
                                    Edit
                                </Link>
                            </li>
                        ))}
                    </ul>
                )}
            </section>
        </AdminShell>
    );
}
