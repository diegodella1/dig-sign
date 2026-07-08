import { revalidatePath } from 'next/cache';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import { programSubNav } from '@/components/broadcast/mode-sub-nav-items';
import { AdminShell } from '@/components/admin/admin-shell';
import { ContentPlaylistItemsEditor } from '@/components/signage/content-playlist-items-editor';
import { ClearStateBadge, FormHeader, Notice, StatusBanner } from '@/components/ui';
import { getAssets, getSlides } from '@/lib/data';
import { getContentPlaylist, type ContentPlaylistApprovalState } from '@/lib/content-playlists';
import { requireTenantScope } from '@/lib/auth/tenancy';
import {
    approveSignagePlaylist,
    rejectSignagePlaylist,
    saveSignagePlaylistItems,
    submitSignagePlaylist,
    updateSignagePlaylist,
} from '@/lib/mutations';

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
    const [scope, playlist, assets, slides] = await Promise.all([
        requireTenantScope(),
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
        revalidatePath('/admin/operate');
        revalidatePath('/admin');
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
        revalidatePath('/admin/playlists');
        revalidatePath('/admin/operate');
        revalidatePath('/admin');
        revalidatePath('/output/live/main');
    }

    async function submitAction() {
        'use server';
        const result = await submitSignagePlaylist({ id });

        if (!result.success) {
            throw new Error(result.error);
        }

        revalidatePath('/admin');
        revalidatePath('/admin/playlists');
        revalidatePath(`/admin/playlists/${id}`);
        revalidatePath('/admin/operate');
    }

    async function approveAction() {
        'use server';
        const result = await approveSignagePlaylist({ id });

        if (!result.success) {
            throw new Error(result.error);
        }

        revalidatePath('/admin');
        revalidatePath('/admin/playlists');
        revalidatePath(`/admin/playlists/${id}`);
        revalidatePath('/admin/screens');
        revalidatePath('/admin/operate');
        revalidatePath('/output/live/main');
    }

    async function rejectAction() {
        'use server';
        const result = await rejectSignagePlaylist({ id });

        if (!result.success) {
            throw new Error(result.error);
        }

        revalidatePath('/admin');
        revalidatePath('/admin/playlists');
        revalidatePath(`/admin/playlists/${id}`);
        revalidatePath('/admin/operate');
    }

    const initialItems = playlist.items.map((item) => ({
        assetId: item.assetId,
        slideId: item.slideId,
        durationSeconds: item.durationSeconds,
    }));

    return (
        <AdminShell title={playlist.name} subNav={programSubNav}>
            <StatusBanner
                tone={approvalTone(playlist.approvalState)}
                label="Approval"
                title={approvalTitle(playlist.approvalState)}
                detail={
                    <>
                        <ClearStateBadge tone={approvalTone(playlist.approvalState)}>
                            {approvalLabel(playlist.approvalState)}
                        </ClearStateBadge>{' '}
                        <span className="ml-2">
                            {playlist.status} ·{' '}
                            {playlist.orientation === 'vertical'
                                ? 'Vertical 9:16'
                                : 'Horizontal 16:9'}{' '}
                            · {playlist.itemCount} items
                        </span>
                    </>
                }
                action={
                    scope.kind === 'global' ? (
                        <>
                            <form action={approveAction}>
                                <button
                                    type="submit"
                                    disabled={!playlist.itemCount}
                                    className="btn-primary disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    Approve
                                </button>
                            </form>
                            {playlist.approvalState !== 'rejected' ? (
                                <form action={rejectAction}>
                                    <button type="submit" className="btn-secondary">
                                        Reject
                                    </button>
                                </form>
                            ) : null}
                        </>
                    ) : (
                        <form action={submitAction}>
                            <button
                                type="submit"
                                disabled={!playlist.itemCount}
                                className="btn-primary disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                Submit for Approval
                            </button>
                        </form>
                    )
                }
            />
            {!playlist.itemCount ? (
                <Notice tone="warn" title="Playlist needs items">
                    Add at least one asset or plate before submitting or assigning this playlist.
                </Notice>
            ) : null}

            <section className="mt-4 rounded-md border border-line bg-surface-elevated-2 p-4">
                <FormHeader
                    title="Playlist settings"
                    detail={
                        scope.kind === 'global'
                            ? 'Super admins can approve vendor playlists for live use.'
                            : 'Saving vendor changes returns this playlist to draft until approval.'
                    }
                />
                <form action={saveMetaAction} className="mt-3 flex flex-wrap gap-3">
                    <input
                        name="name"
                        defaultValue={playlist.name}
                        className="min-w-[16rem] flex-1 rounded-md border border-line bg-surface px-3 py-2"
                    />
                    {scope.kind === 'global' ? (
                        <select
                            name="status"
                            defaultValue={playlist.status}
                            className="rounded-md border border-line bg-surface px-3 py-2"
                        >
                            <option value="draft">Draft</option>
                            <option value="ready">Ready</option>
                            <option value="archived">Archived</option>
                        </select>
                    ) : (
                        <input type="hidden" name="status" value="draft" />
                    )}
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

function approvalTitle(state: ContentPlaylistApprovalState) {
    switch (state) {
        case 'submitted':
            return 'Ready for super admin review';
        case 'approved':
            return 'Approved for live screens';
        case 'rejected':
            return 'Rejected by super admin';
        default:
            return 'Draft, not live';
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
