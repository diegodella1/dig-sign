import { prepareSubNav } from '@/components/broadcast/mode-sub-nav-items';
import { FlowLinkList } from '@/components/admin/admin-flow';
import { AdminShell } from '@/components/admin/admin-shell';
import { getAssets, getSlides } from '@/lib/data';

export const dynamic = 'force-dynamic';

export default async function PreparePage() {
    const [assets, slides] = await Promise.all([getAssets(), getSlides()]);
    const readyAssets = assets.filter((asset) => asset.status === 'ready');
    const reviewAssets = assets.filter((asset) => asset.status !== 'ready');
    const musicAssets = assets.filter((asset) => asset.assetType === 'music');
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
                        href: '/admin/playlists',
                        label: 'Playlists',
                        badge: `${plateCount} plates ready for loops`,
                    },
                    {
                        href: '/admin/assets',
                        label: 'Media',
                        badge: `${readyAssets.length}/${assets.length} ready`,
                        ...(reviewAssets.length ? { tone: 'warn' as const } : {}),
                    },
                    { href: '/admin/vimeo', label: 'Import' },
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
