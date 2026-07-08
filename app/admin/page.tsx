import Link from 'next/link';
import { MonitorPlay, PackageOpen, RadioTower } from 'lucide-react';

import { AdminShell } from '@/components/admin/admin-shell';
import { ButtonLink, Notice } from '@/components/ui';
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
                <Notice tone={healthReport.status === 'fail' ? 'danger' : 'warn'} title="System health">
                    <Link href="/admin/health" className="font-semibold underline">
                        Review health
                    </Link>{' '}
                    before handoff.
                </Notice>
            ) : null}

            <section className="grid gap-3 md:grid-cols-3">
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
    tone: 'operate' | 'program' | 'prepare';
}) {
    const accent =
        tone === 'operate'
            ? 'border-accent-live/40 hover:border-accent-live'
            : tone === 'program'
              ? 'border-accent-positive/30 hover:border-accent-positive'
              : 'border-line hover:border-line-strong';

    return (
        <Link
            href={href}
            className={`block rounded-md border bg-surface-elevated-2 p-4 transition ${accent}`}
        >
            <div className="flex items-center gap-2 text-accent-positive">
                <Icon size={18} aria-hidden="true" />
                <span className="text-xs font-bold uppercase tracking-wide">{title}</span>
            </div>
            <p className="mt-3 text-sm text-muted">{detail}</p>
        </Link>
    );
}
