import { prepareSubNav } from '@/components/broadcast/mode-sub-nav-items';
import { FlowLinkList } from '@/components/admin/admin-flow';
import { AdminShell } from '@/components/admin/admin-shell';
import { getAssets, getGuests, getSlides } from '@/lib/data';
import { fallbackCarouselDisplayName, getGlobalFallbackCarousel } from '@/lib/fallback-carousel';
import { findFallbackCandidate } from '@/lib/scheduling/fallback';

export const dynamic = 'force-dynamic';

export default async function PreparePage() {
    const [assets, slides, carousel, guests] = await Promise.all([
        getAssets(),
        getSlides(),
        getGlobalFallbackCarousel(),
        getGuests(),
    ]);
    const readyAssets = assets.filter((asset) => asset.status === 'ready');
    const reviewAssets = assets.filter((asset) => asset.status !== 'ready');
    const musicAssets = assets.filter((asset) => asset.assetType === 'music');
    const silentVideo = findFallbackCandidate(assets);
    const carouselActive = Boolean(carousel?.enabled && carousel.cards.length);
    const carouselSetName = fallbackCarouselDisplayName(carousel);
    const gapFillReady = Boolean(silentVideo || carouselActive);
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
                        href: '/admin/prepare/gap-fill',
                        label: 'Gap fill',
                        badge: gapFillReady ? (carouselSetName ?? 'Ready') : 'Not set',
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
