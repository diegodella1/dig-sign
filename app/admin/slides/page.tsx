import { prepareSubNav } from '@/components/broadcast/mode-sub-nav-items';
import { AdminShell } from '@/components/admin/admin-shell';
import { PlatesWorkspace } from '@/components/prepare/plates-workspace';
import { ButtonLink } from '@/components/ui';
import { getSlides } from '@/lib/data';

import {
    addCustomPlateAction,
    addWeatherPlateAction,
    addYouTubePlateAction,
    archivePlate,
    updateWeatherPlateAction,
} from './actions';

export const dynamic = 'force-dynamic';

export default async function SlidesPage({
    searchParams,
}: {
    searchParams: Promise<{ tab?: string }>;
}) {
    const params = await searchParams;
    const slides = await getSlides();
    const readyCount = slides.filter((slide) => slide.status === 'ready').length;

    return (
        <AdminShell
            title="Plates"
            description="Create and review display-ready graphics before scheduling."
            subNav={prepareSubNav}
            actions={
                <ButtonLink href="/admin/playlists" variant="secondary">
                    Fallback policy
                </ButtonLink>
            }
        >
            <section className="mb-5 grid gap-3 md:grid-cols-2">
                <Metric label="Active plates" value={String(slides.filter((s) => s.status !== 'archived').length)} />
                <Metric label="Ready" value={String(readyCount)} />
            </section>

            <PlatesWorkspace
                slides={slides}
                initialTab={params.tab}
                archivePlate={archivePlate}
                addWeatherPlateAction={addWeatherPlateAction}
                updateWeatherPlateAction={updateWeatherPlateAction}
                addYouTubePlateAction={addYouTubePlateAction}
                addCustomPlateAction={addCustomPlateAction}
            />
        </AdminShell>
    );
}

function Metric({ label, value }: { label: string; value: string }) {
    return (
        <div className="surface-panel p-4">
            <p className="text-xs font-semibold uppercase text-muted">{label}</p>
            <p className="mt-1 text-2xl font-semibold tabular-nums">{value}</p>
        </div>
    );
}
