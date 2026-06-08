import { prepareSubNav } from '@/components/broadcast/mode-sub-nav-items';
import { FlowLinkList } from '@/components/admin/admin-flow';
import { AdminShell } from '@/components/admin/admin-shell';
import { getAssets, getGuests, getSlides } from '@/lib/data';
import { loadFallbackPolicyStatus } from '@/lib/fallback-policy';

export const dynamic = 'force-dynamic';

export default async function PreparePage() {
    const [assets, slides, fallbackPolicy, guests] = await Promise.all([
        getAssets(),
        getSlides(),
        loadFallbackPolicyStatus(),
        getGuests(),
    ]);
    const readyAssets = assets.filter((asset) => asset.status === 'ready');
    const reviewAssets = assets.filter((asset) => asset.status !== 'ready');
    const musicAssets = assets.filter((asset) => asset.assetType === 'music');
    const gapFillReady = fallbackPolicy.ready;
    const activeGuests = guests.filter((guest) => guest.status !== 'archived');
    const readyGuests = guests.filter((guest) => guest.status === 'ready');
    const plateCount = slides.filter((slide) => slide.status !== 'archived').length;

    return (
        <AdminShell title="Prepare" subNav={prepareSubNav}>
            <FlowLinkList
                items={[
                    {
                        href: '/admin/slides',
                        label: 'Plates',
                        badge: `${plateCount} active`,
                    },
                    {
                        href: '/admin/program/fallback',
                        label: 'Fallback policy',
                        badge: fallbackPolicy.label,
                        ...(gapFillReady ? {} : { tone: 'warn' as const }),
                    },
                    {
                        href: '/admin/assets',
                        label: 'Media',
                        badge: `${readyAssets.length}/${assets.length} ready`,
                        ...(reviewAssets.length ? { tone: 'warn' as const } : {}),
                    },
                    { href: '/admin/vimeo', label: 'Import' },
                    {
                        href: '/admin/guests',
                        label: 'People',
                        badge: `${readyGuests.length}/${activeGuests.length} ready`,
                        ...(readyGuests.length < activeGuests.length
                            ? { tone: 'warn' as const }
                            : {}),
                    },
                    {
                        href: '/admin/music',
                        label: 'Music',
                        badge: `${musicAssets.length} tracks`,
                    },
                ]}
            />
        </AdminShell>
    );
}
