import { redirect } from 'next/navigation';

import { programSubNavForDate } from '@/components/broadcast/mode-sub-nav-items';
import { AdminShell } from '@/components/admin/admin-shell';
import { FallbackPlaylistSelector } from '@/components/program/fallback-playlist-selector';
import { FallbackPolicyPanel } from '@/components/program/fallback-policy-panel';
import { PlateRotationEditor } from '@/components/program/plate-rotation-editor';
import { ButtonLink, Notice } from '@/components/ui';
import { getAssets, getSlides } from '@/lib/data';
import { getGlobalFallbackCarousel } from '@/lib/fallback-carousel';
import { listSilentVideoCandidates, resolveFallbackPolicyStatus } from '@/lib/fallback-policy';
import { isoDateInTimezone, PLAYOUT_TIMEZONE } from '@/lib/helpers/time';
import { getMusicOutputSettings, listPlaylists } from '@/lib/music-playlists';
import {
    activateFallbackCarouselSet,
    assignFallbackPlaylist,
    deleteFallbackCarouselSet,
    saveFallbackCarouselSet,
    setFallbackPolicy,
} from '@/lib/mutations';

import type { FallbackPolicyMode } from '@/lib/fallback-policy';

export const dynamic = 'force-dynamic';

export default async function FallbackPolicyPage({
    searchParams,
}: {
    searchParams: Promise<{ saved?: string; rotation_saved?: string }>;
}) {
    const params = await searchParams;
    const today = isoDateInTimezone(new Date(), PLAYOUT_TIMEZONE);
    const [assets, slides, carousel, playlists, outputSettings] = await Promise.all([
        getAssets(),
        getSlides(),
        getGlobalFallbackCarousel(),
        listPlaylists(),
        getMusicOutputSettings(),
    ]);
    const activeSlides = slides.filter((slide) => slide.status !== 'archived');
    const status = resolveFallbackPolicyStatus({
        mediaAssets: assets,
        slideAssets: activeSlides,
        carousel,
    });
    const videoCandidates = listSilentVideoCandidates(assets);
    const selectedVideoId =
        assets.find((asset) => asset.metadata?.fallback_loop === true)?.id ??
        videoCandidates[0]?.id ??
        '';
    const selectedRotationSetId = carousel?.activeSetId ?? carousel?.sets[0]?.id ?? '';

    async function savePolicy(formData: FormData) {
        'use server';
        const mode = String(formData.get('mode') || 'emergency_only') as FallbackPolicyMode;
        const result = await setFallbackPolicy({
            mode,
            videoId: String(formData.get('video_id') || '') || undefined,
            rotationSetId: String(formData.get('rotation_set_id') || '') || undefined,
        });

        if (!result.success) {
            throw new Error(result.error);
        }

        redirect('/admin/program/fallback?saved=1');
    }

    async function saveRotationSet(formData: FormData) {
        'use server';
        const result = await saveFallbackCarouselSet({
            setId: String(formData.get('set_id') || '') || undefined,
            name: String(formData.get('name') || ''),
            cards: formData.getAll('item_ids').map((itemId, index) => ({
                id: String(itemId),
                kind: String(formData.getAll('item_kinds')[index] || 'slide'),
                durationSeconds: Number(formData.getAll('durations')[index] || 30),
            })),
        });

        if (!result.success) {
            throw new Error(result.error);
        }

        redirect('/admin/program/fallback?rotation_saved=1');
    }

    async function activateRotationSet(formData: FormData) {
        'use server';
        const result = await activateFallbackCarouselSet(String(formData.get('set_id') || ''));

        if (!result.success) {
            throw new Error(result.error);
        }

        redirect('/admin/program/fallback');
    }

    async function deleteRotationSet(formData: FormData) {
        'use server';
        const result = await deleteFallbackCarouselSet(String(formData.get('set_id') || ''));

        if (!result.success) {
            throw new Error(result.error);
        }

        redirect('/admin/program/fallback');
    }

    async function saveFallbackPlaylistAction(formData: FormData) {
        'use server';
        const playlistId = String(formData.get('playlist_id') || '');

        if (!playlistId) {
            throw new Error('Choose a fallback playlist');
        }

        const result = await assignFallbackPlaylist(playlistId);

        if (!result.success) {
            throw new Error(result.error);
        }

        redirect('/admin/program/fallback?saved=1');
    }

    return (
        <AdminShell title="Fallback policy" subNav={programSubNavForDate(today)}>
            {params.saved ? <Notice tone="ok">Fallback policy saved.</Notice> : null}
            {params.rotation_saved ? (
                <Notice tone="ok">Plate rotation set saved.</Notice>
            ) : null}

            <FallbackPolicyPanel
                status={status}
                videoCandidates={videoCandidates}
                carousel={carousel}
                selectedVideoId={selectedVideoId}
                selectedRotationSetId={selectedRotationSetId}
                savePolicy={savePolicy}
            />

            <div className="mt-4">
                <PlateRotationEditor
                    slides={activeSlides}
                    assets={assets}
                    carousel={carousel}
                    selectedSetId={selectedRotationSetId}
                    saveSet={saveRotationSet}
                    activateSet={activateRotationSet}
                    deleteSet={deleteRotationSet}
                />
            </div>

            <FallbackPlaylistSelector
                playlists={playlists.filter((playlist) => playlist.status !== 'archived')}
                selectedPlaylistId={outputSettings.fallbackPlaylistId}
                saveAction={saveFallbackPlaylistAction}
            />

            <div className="mt-4 flex flex-wrap gap-2">
                <ButtonLink href="/admin/program" variant="secondary">
                    Program
                </ButtonLink>
                <ButtonLink href="/admin/assets" variant="secondary">
                    Media
                </ButtonLink>
            </div>
        </AdminShell>
    );
}
