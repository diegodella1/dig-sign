import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

import { prepareSubNav } from '@/components/broadcast/mode-sub-nav-items';
import { AdminShell } from '@/components/admin/admin-shell';
import { SilentFallbackPanel } from '@/components/prepare/silent-fallback-panel';
import { FallbackSetsPanel } from '@/components/slides/fallback-sets-panel';
import { Notice } from '@/components/ui';
import { getAssets, getSlides } from '@/lib/data';
import { fallbackCarouselDisplayName, getGlobalFallbackCarousel } from '@/lib/fallback-carousel';
import {
    activateFallbackCarouselSet,
    deleteFallbackCarouselSet,
    saveFallbackCarouselSet,
    updateMediaAsset,
} from '@/lib/mutations';
import { findFallbackCandidate } from '@/lib/scheduling/fallback';

export const dynamic = 'force-dynamic';

function canUseAsSilentFallback(asset: Awaited<ReturnType<typeof getAssets>>[number]) {
    return (
        asset.status === 'ready' &&
        asset.mediaKind === 'video' &&
        asset.assetType !== 'music' &&
        Boolean(asset.url || asset.storagePath || asset.vimeoId)
    );
}

function lifecycleState(asset: Awaited<ReturnType<typeof getAssets>>[number]) {
    return String(asset.metadata?.lifecycle_state || asset.lifecycleState || 'reviewed');
}

export default async function GapFillPage({
    searchParams,
}: {
    searchParams: Promise<{ saved?: string }>;
}) {
    const params = await searchParams;
    const [slides, assets, carousel] = await Promise.all([
        getSlides(),
        getAssets(),
        getGlobalFallbackCarousel(),
    ]);
    const activeSlides = slides.filter((slide) => slide.status !== 'archived');
    const silentCandidates = assets.filter(canUseAsSilentFallback);
    const silentAsset = findFallbackCandidate(assets);
    const carouselName = fallbackCarouselDisplayName(carousel);
    const gapFillReady = Boolean(silentAsset || carousel?.enabled);

    async function setSilentFallback(formData: FormData) {
        'use server';
        const assetId = String(formData.get('asset_id') || '');
        const asset = (await getAssets()).find((item) => item.id === assetId);

        if (!asset) {
            throw new Error('Asset not found');
        }

        const result = await updateMediaAsset({
            id: asset.id,
            title: asset.title,
            description: asset.description ?? '',
            sourceType: asset.sourceType,
            mediaKind: asset.mediaKind,
            assetType: asset.assetType,
            url: asset.url ?? '',
            thumbnailUrl: asset.thumbnailUrl ?? '',
            ...(asset.durationSeconds ? { durationSeconds: asset.durationSeconds } : {}),
            status: asset.status,
            lifecycleState: lifecycleState(asset),
            orientation: String(asset.metadata?.orientation || 'auto'),
            fallbackLoop: true,
        });

        if (!result.success) {
            throw new Error(result.error);
        }

        revalidatePath('/admin/prepare/gap-fill');
        revalidatePath('/admin/assets');
        revalidatePath('/admin/program');
        redirect('/admin/prepare/gap-fill?saved=1');
    }

    async function clearSilentFallback() {
        'use server';
        const asset = findFallbackCandidate(await getAssets());

        if (!asset) {
            redirect('/admin/prepare/gap-fill');
        }

        const result = await updateMediaAsset({
            id: asset.id,
            title: asset.title,
            description: asset.description ?? '',
            sourceType: asset.sourceType,
            mediaKind: asset.mediaKind,
            assetType: asset.assetType,
            url: asset.url ?? '',
            thumbnailUrl: asset.thumbnailUrl ?? '',
            ...(asset.durationSeconds ? { durationSeconds: asset.durationSeconds } : {}),
            status: asset.status,
            lifecycleState: lifecycleState(asset),
            orientation: String(asset.metadata?.orientation || 'auto'),
            fallbackLoop: false,
        });

        if (!result.success) {
            throw new Error(result.error);
        }

        revalidatePath('/admin/prepare/gap-fill');
        revalidatePath('/admin/assets');
        redirect('/admin/prepare/gap-fill?saved=1');
    }

    async function saveFallbackSet(formData: FormData) {
        'use server';
        const result = await saveFallbackCarouselSet({
            setId: String(formData.get('set_id') || '') || undefined,
            name: String(formData.get('name') || ''),
            cards: formData.getAll('item_ids').map((itemId, index) => {
                const kind = String(formData.getAll('item_kinds')[index] || 'slide');

                return {
                    id: String(itemId),
                    kind,
                    durationSeconds: Number(formData.getAll('durations')[index] || 30),
                };
            }),
        });

        if (!result.success) {
            throw new Error(result.error);
        }

        revalidatePath('/admin/prepare/gap-fill');
        revalidatePath('/admin/program');
        redirect('/admin/prepare/gap-fill?saved=1');
    }

    async function activateFallbackSet(formData: FormData) {
        'use server';
        const result = await activateFallbackCarouselSet(String(formData.get('set_id') || ''));

        if (!result.success) {
            throw new Error(result.error);
        }

        revalidatePath('/admin/prepare/gap-fill');
        redirect('/admin/prepare/gap-fill?saved=1');
    }

    async function deleteFallbackSet(formData: FormData) {
        'use server';
        const result = await deleteFallbackCarouselSet(String(formData.get('set_id') || ''));

        if (!result.success) {
            throw new Error(result.error);
        }

        revalidatePath('/admin/prepare/gap-fill');
        redirect('/admin/prepare/gap-fill?saved=1');
    }

    return (
        <AdminShell
            title="Gap fill"
            description="What plays when nothing is scheduled on air."
            subNav={prepareSubNav}
        >
            {params.saved ? (
                <Notice tone="ok" title="Gap fill updated">
                    Silent video and carousel settings saved.
                </Notice>
            ) : null}

            <section className="mb-5 rounded-md border border-line bg-surface-elevated-2 p-4 text-sm">
                <p className="font-semibold">Playback priority during gaps</p>
                <ol className="mt-2 list-decimal space-y-1 pl-5 text-muted">
                    <li>Silent fallback video (optional, below)</li>
                    <li>Rotating carousel of plates and promos</li>
                    <li>Generic placeholder if neither is configured</li>
                </ol>
                <p className="mt-3 text-xs text-muted">
                    Status:{' '}
                    <span className={gapFillReady ? 'text-accent-positive' : 'text-warn-strong'}>
                        {gapFillReady
                            ? [silentAsset?.title, carouselName].filter(Boolean).join(' · ')
                            : 'Not configured'}
                    </span>
                </p>
            </section>

            <div className="grid gap-5">
                <SilentFallbackPanel
                    candidates={silentCandidates}
                    activeAssetId={silentAsset?.id ?? null}
                    setSilentFallback={setSilentFallback}
                    clearSilentFallback={clearSilentFallback}
                />

                <section className="surface-panel overflow-hidden">
                    <div className="border-b border-line p-4">
                        <h2 className="text-sm font-semibold">Rotating carousel</h2>
                        <p className="mt-1 text-sm text-muted">
                            Pick ready plates and promo/ad videos, drag to reorder, then save a named
                            set and activate it.
                        </p>
                    </div>
                    <FallbackSetsPanel
                        embedded
                        slides={activeSlides}
                        assets={assets}
                        carousel={carousel}
                        saveSet={saveFallbackSet}
                        activateSet={activateFallbackSet}
                        deleteSet={deleteFallbackSet}
                    />
                </section>
            </div>
        </AdminShell>
    );
}
