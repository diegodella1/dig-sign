import Link from 'next/link';
import { MonitorPlay, PackageOpen, RadioTower, Settings } from 'lucide-react';

import { AdminShell } from '@/components/admin/admin-shell';
import { ButtonLink, MetricTile, Notice } from '@/components/ui';
import { getAssetSummaries } from '@/lib/data';
import { collectOperatorHealth } from '@/lib/health/health-checks';
import { listContentPlaylists } from '@/lib/content-playlists';
import { buildSignageMonitorPayload } from '@/lib/output/screen-monitor';
import { listScreens } from '@/lib/screens';

export const dynamic = 'force-dynamic';

export default async function AdminDashboardPage() {
    const [assets, healthReport, screens, playlists, monitor] = await Promise.all([
        getAssetSummaries(),
        collectOperatorHealth(),
        listScreens(),
        listContentPlaylists(),
        buildSignageMonitorPayload(),
    ]);
    const readyAssets = assets.filter((asset) => asset.status === 'ready').length;
    const needsFix = assets.length - readyAssets;
    const readyPlaylists = playlists.filter((playlist) => playlist.status === 'ready').length;
    const issueScreens = monitor.screens.filter(
        (screen) => !screen.playlistId || screen.outputKind === 'fallback',
    ).length;

    return (
        <AdminShell
            title="Dashboard"
            description="Signage overview. Use Operate to monitor players."
            actions={<ButtonLink href="/admin/operate">Open Operate</ButtonLink>}
        >
            {healthReport.status !== 'ok' ? (
                <Notice
                    tone={healthReport.status === 'fail' ? 'danger' : 'warn'}
                    title="System health"
                >
                    <Link href="/admin/health" className="font-semibold underline">
                        Review health
                    </Link>{' '}
                    before handoff.
                </Notice>
            ) : null}

            <section className="mb-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <MetricTile
                    label="Active Screens"
                    value={String(screens.length)}
                    detail={issueScreens ? `${issueScreens} need attention` : 'All clear'}
                    tone={issueScreens ? 'warn' : 'ok'}
                />
                <MetricTile
                    label="Playlists on Air"
                    value={String(readyPlaylists)}
                    detail="Ready content playlists"
                    tone="info"
                />
                <MetricTile
                    label="Media Ready"
                    value={`${readyAssets}/${assets.length}`}
                    detail={needsFix ? `${needsFix} need review` : 'Library ready'}
                    tone={needsFix ? 'warn' : 'ok'}
                />
                <MetricTile
                    label="System Health"
                    value={healthReport.status.toUpperCase()}
                    detail="Operator readiness"
                    tone={healthReport.status === 'ok' ? 'ok' : 'danger'}
                />
            </section>

            <section className="mb-3">
                <h2 className="font-display text-2xl font-bold uppercase">Quick Access Modules</h2>
                <p className="mt-1 text-sm font-medium text-muted">
                    Move between live control, content prep, screens, and operator settings.
                </p>
            </section>

            <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
                <ModeCard
                    href="/admin/operate"
                    icon={RadioTower}
                    title="Operate"
                    detail={`${screens.length} screen${screens.length === 1 ? '' : 's'} · ${issueScreens ? `${issueScreens} need attention` : 'all clear'}`}
                    tone="operate"
                />
                <ModeCard
                    href="/admin/screens"
                    icon={MonitorPlay}
                    title="Signage"
                    detail={`${readyPlaylists} ready playlist${readyPlaylists === 1 ? '' : 's'}`}
                    tone="program"
                />
                <ModeCard
                    href="/admin/prepare"
                    icon={PackageOpen}
                    title="Prepare"
                    detail={`${readyAssets} ready · ${needsFix} need fix`}
                    tone="prepare"
                />
                <ModeCard
                    href="/admin/settings"
                    icon={Settings}
                    title="Admin"
                    detail="Operators, health, audit, and settings"
                    tone="neutral"
                />
            </section>
        </AdminShell>
    );
}

function ModeCard({
    href,
    icon: Icon,
    title,
    detail,
    tone,
}: {
    href: string;
    icon: typeof RadioTower;
    title: string;
    detail: string;
    tone: 'operate' | 'program' | 'prepare' | 'neutral';
}) {
    const accent =
        tone === 'operate'
            ? 'hover:bg-danger-soft'
            : tone === 'program'
              ? 'hover:bg-info-soft'
              : tone === 'prepare'
                ? 'hover:bg-surface-selected-positive'
                : 'hover:bg-panel-soft';

    return (
        <Link
            href={href}
            className={`surface-card group flex min-h-40 flex-col justify-between p-5 transition hover:-translate-x-1 hover:-translate-y-1 hover:shadow-[6px_6px_0_#1a1a1a] ${accent}`}
        >
            <div className="flex items-center justify-between gap-3 text-ink">
                <Icon size={34} aria-hidden="true" />
                <span className="border-2 border-line bg-surface-selected-positive px-2 py-1 font-headline text-[10px] font-bold uppercase">
                    Open
                </span>
            </div>
            <div>
                <h3 className="font-display text-xl font-bold uppercase">{title}</h3>
                <p className="mt-2 text-sm font-medium text-muted">{detail}</p>
            </div>
        </Link>
    );
}
