import { revalidatePath } from 'next/cache';
import Link from 'next/link';

import { programSubNav } from '@/components/broadcast/mode-sub-nav-items';
import { AdminShell } from '@/components/admin/admin-shell';
import { ClearStateBadge, EmptyState, FormHeader } from '@/components/ui';
import { listContentPlaylists, type ContentPlaylistApprovalState } from '@/lib/content-playlists';
import { requireTenantScope } from '@/lib/auth/tenancy';
import { createSignagePlaylist } from '@/lib/mutations';
import { listVendors } from '@/lib/vendors';

export const dynamic = 'force-dynamic';

export default async function PlaylistsPage() {
    const scope = await requireTenantScope();
    const playlists = await listContentPlaylists();
    const vendors = scope.kind === 'global' ? await listVendors() : [];
    const vendorNameById = new Map(vendors.map((vendor) => [vendor.id, vendor.name]));
    const submittedPlaylists = playlists.filter(
        (playlist) => playlist.approvalState === 'submitted',
    );

    async function createPlaylistAction(formData: FormData) {
        'use server';
        const result = await createSignagePlaylist({
            name: String(formData.get('name') || ''),
            status: 'draft',
            orientation:
                String(formData.get('orientation') || 'horizontal') === 'vertical'
                    ? 'vertical'
                    : 'horizontal',
        });

        if (!result.success) {
            throw new Error(result.error);
        }

        revalidatePath('/admin/playlists');
    }

    return (
        <AdminShell title="Playlists" subNav={programSubNav}>
            <section className="rounded-md border border-line bg-surface-elevated-2 p-4">
                <FormHeader
                    title="New playlist"
                    detail="Build ordered loops of slides and media. Vendor playlists require approval before live use."
                />
                <form action={createPlaylistAction} className="mt-3 flex flex-wrap gap-3">
                    <input
                        name="name"
                        required
                        placeholder="Morning loop"
                        className="min-w-[16rem] flex-1 rounded-md border border-line bg-surface px-3 py-2"
                    />
                    <select
                        name="orientation"
                        defaultValue="horizontal"
                        className="rounded-md border border-line bg-surface px-3 py-2"
                    >
                        <option value="horizontal">Horizontal 16:9</option>
                        <option value="vertical">Vertical 9:16</option>
                    </select>
                    <button
                        type="submit"
                        className="rounded-md bg-accent-positive px-4 py-2 text-sm font-semibold text-white"
                    >
                        Create Draft
                    </button>
                </form>
            </section>

            {scope.kind === 'global' && submittedPlaylists.length ? (
                <section className="mt-6 rounded-md border border-line bg-surface-selected-positive p-4 shadow-[4px_4px_0_#1a1a1a]">
                    <FormHeader
                        title="Approval queue"
                        detail="Review vendor submissions before they can be assigned or rendered live."
                    />
                    <ul className="mt-3 divide-y divide-line">
                        {submittedPlaylists.map((playlist) => (
                            <li
                                key={playlist.id}
                                className="flex flex-wrap items-center justify-between gap-3 py-3 first:pt-0 last:pb-0"
                            >
                                <div>
                                    <p className="font-semibold">{playlist.name}</p>
                                    <p className="text-sm text-muted">
                                        {vendorNameById.get(playlist.vendorId) ?? playlist.vendorId}{' '}
                                        · {playlist.itemCount} items ·{' '}
                                        {orientationLabel(playlist.orientation)}
                                    </p>
                                </div>
                                <Link
                                    href={`/admin/playlists/${playlist.id}`}
                                    className="rounded-md border border-line bg-surface px-3 py-1.5 text-sm font-semibold"
                                >
                                    Review
                                </Link>
                            </li>
                        ))}
                    </ul>
                </section>
            ) : null}

            <section className="mt-6">
                <FormHeader
                    title="Content playlists"
                    detail="Only approved, ready playlists can be assigned to screens."
                />
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
                                    <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-muted">
                                        <span>{playlist.itemCount} items</span>
                                        <span>·</span>
                                        <ClearStateBadge
                                            tone={approvalTone(playlist.approvalState)}
                                        >
                                            {approvalLabel(playlist.approvalState)}
                                        </ClearStateBadge>
                                        <span>{playlist.status}</span>
                                        <span>·</span>
                                        <span>{orientationLabel(playlist.orientation)}</span>
                                        {scope.kind === 'global' ? (
                                            <>
                                                <span>·</span>
                                                <span>
                                                    {vendorNameById.get(playlist.vendorId) ??
                                                        playlist.vendorId}
                                                </span>
                                            </>
                                        ) : null}
                                    </div>
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

function approvalLabel(state: ContentPlaylistApprovalState) {
    switch (state) {
        case 'submitted':
            return 'Submitted';
        case 'approved':
            return 'Approved';
        case 'rejected':
            return 'Rejected';
        default:
            return 'Draft';
    }
}

function approvalTone(state: ContentPlaylistApprovalState) {
    switch (state) {
        case 'submitted':
            return 'warn';
        case 'approved':
            return 'ok';
        case 'rejected':
            return 'danger';
        default:
            return 'neutral';
    }
}

function orientationLabel(orientation: 'horizontal' | 'vertical') {
    return orientation === 'vertical' ? 'Vertical 9:16' : 'Horizontal 16:9';
}
