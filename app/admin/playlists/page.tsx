import { revalidatePath } from 'next/cache';
import Link from 'next/link';

import { programSubNav } from '@/components/broadcast/mode-sub-nav-items';
import { AdminShell } from '@/components/admin/admin-shell';
import { ClearStateBadge, EmptyState, FilterLink, FormHeader } from '@/components/ui';
import { listContentPlaylists, type ContentPlaylistApprovalState } from '@/lib/content-playlists';
import { requireTenantScope } from '@/lib/auth/tenancy';
import { createSignagePlaylist } from '@/lib/mutations';
import { listVendors } from '@/lib/vendors';

export const dynamic = 'force-dynamic';

export default async function PlaylistsPage({
    searchParams,
}: {
    searchParams: Promise<{ approval?: string; orientation?: string }>;
}) {
    const params = await searchParams;
    const scope = await requireTenantScope();
    const playlists = await listContentPlaylists();
    const vendors = scope.kind === 'global' ? await listVendors() : [];
    const vendorNameById = new Map(vendors.map((vendor) => [vendor.id, vendor.name]));
    const submittedPlaylists = playlists.filter(
        (playlist) => playlist.approvalState === 'submitted',
    );
    const visiblePlaylists = playlists.filter((playlist) => {
        if (params.approval && playlist.approvalState !== params.approval) {
            return false;
        }

        if (params.orientation && playlist.orientation !== params.orientation) {
            return false;
        }

        return true;
    });
    const horizontalPlaylists = visiblePlaylists.filter(
        (playlist) => playlist.orientation === 'horizontal',
    );
    const verticalPlaylists = visiblePlaylists.filter(
        (playlist) => playlist.orientation === 'vertical',
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
            <section className="surface-card p-4">
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
                    <button type="submit" className="btn-primary">
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

            <section className="mt-6 surface-panel p-3">
                <div className="flex flex-wrap items-center gap-2">
                    <FilterLink
                        href="/admin/playlists"
                        active={!params.approval && !params.orientation}
                    >
                        Todas
                    </FilterLink>
                    <FilterLink
                        href="/admin/playlists?approval=draft"
                        active={params.approval === 'draft'}
                    >
                        Drafts
                    </FilterLink>
                    <FilterLink
                        href="/admin/playlists?approval=submitted"
                        active={params.approval === 'submitted'}
                    >
                        Aprobacion
                    </FilterLink>
                    <FilterLink
                        href="/admin/playlists?approval=approved"
                        active={params.approval === 'approved'}
                    >
                        Aprobadas
                    </FilterLink>
                    <FilterLink
                        href="/admin/playlists?orientation=vertical"
                        active={params.orientation === 'vertical'}
                    >
                        Vertical 9:16
                    </FilterLink>
                    <FilterLink
                        href="/admin/playlists?orientation=horizontal"
                        active={params.orientation === 'horizontal'}
                    >
                        Horizontal 16:9
                    </FilterLink>
                </div>
            </section>

            {!playlists.length ? (
                <section className="mt-6">
                    <EmptyState title="No playlists yet">
                        Create a vertical or horizontal playlist, add items, then send it for
                        approval.
                    </EmptyState>
                </section>
            ) : (
                <section className="mt-6 grid gap-6 xl:grid-cols-2">
                    <PlaylistOrientationPanel
                        title="Vertical 9:16"
                        playlists={verticalPlaylists}
                        scopeKind={scope.kind}
                        vendorNameById={vendorNameById}
                    />
                    <PlaylistOrientationPanel
                        title="Horizontal 16:9"
                        playlists={horizontalPlaylists}
                        scopeKind={scope.kind}
                        vendorNameById={vendorNameById}
                    />
                </section>
            )}
            {playlists.length > 0 && !visiblePlaylists.length ? (
                <section className="mt-6">
                    <EmptyState title="No playlists for this filter">
                        Change filters or create a new draft for this orientation.
                    </EmptyState>
                </section>
            ) : null}
        </AdminShell>
    );
}

function PlaylistOrientationPanel({
    title,
    playlists,
    scopeKind,
    vendorNameById,
}: {
    title: string;
    playlists: Awaited<ReturnType<typeof listContentPlaylists>>;
    scopeKind: 'global' | 'vendor';
    vendorNameById: Map<string, string>;
}) {
    return (
        <section className="surface-card overflow-hidden">
            <div className="border-b-2 border-line bg-panel-soft px-4 py-3">
                <FormHeader
                    title={title}
                    detail="Only matching screens can use playlists from this group."
                />
            </div>
            {!playlists.length ? (
                <div className="p-4">
                    <EmptyState title={`No ${title.toLowerCase()} playlists`}>
                        Create a draft with this orientation before assigning screens.
                    </EmptyState>
                </div>
            ) : (
                <ul className="divide-y divide-line">
                    {playlists.map((playlist) => (
                        <li
                            key={playlist.id}
                            className="flex flex-wrap items-center justify-between gap-3 px-4 py-3"
                        >
                            <div>
                                <p className="font-semibold">{playlist.name}</p>
                                <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-muted">
                                    <span>{playlist.itemCount} items</span>
                                    <ClearStateBadge tone={approvalTone(playlist.approvalState)}>
                                        {approvalLabel(playlist.approvalState)}
                                    </ClearStateBadge>
                                    <span>{playlist.status}</span>
                                    {scopeKind === 'global' ? (
                                        <span>
                                            {vendorNameById.get(playlist.vendorId) ??
                                                playlist.vendorId}
                                        </span>
                                    ) : null}
                                </div>
                            </div>
                            <Link
                                href={`/admin/playlists/${playlist.id}`}
                                className="btn-secondary"
                            >
                                {playlistActionLabel(playlist.approvalState, scopeKind)}
                            </Link>
                        </li>
                    ))}
                </ul>
            )}
        </section>
    );
}

function playlistActionLabel(state: ContentPlaylistApprovalState, scopeKind: 'global' | 'vendor') {
    if (scopeKind === 'global') {
        return state === 'submitted' ? 'Aprobar' : 'Revisar';
    }

    if (state === 'draft' || state === 'rejected') {
        return 'Editar draft';
    }

    if (state === 'submitted') {
        return 'Ver envio';
    }

    return 'Asignar';
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
