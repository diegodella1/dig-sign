import Link from 'next/link';
import { RadioTower, CalendarDays, PackageOpen } from 'lucide-react';

import { AdminShell } from '@/components/admin/admin-shell';
import { ButtonLink, Notice } from '@/components/ui';
import { getAssetSummaries, getLiveSchedule } from '@/lib/data';
import { collectOperatorHealth } from '@/lib/health/health-checks';
import { analyzeSchedule } from '@/lib/scheduling/schedule-health';
import { findActiveSchedule } from '@/lib/scheduling/scheduler';
import {
    isoDateInTimezone,
    PLAYOUT_TIMEZONE,
    secondsSinceMidnightInTimezone,
} from '@/lib/helpers/time';

export const dynamic = 'force-dynamic';

export default async function AdminDashboardPage() {
    const today = isoDateInTimezone(new Date(), PLAYOUT_TIMEZONE);
    const [schedule, assets, healthReport] = await Promise.all([
        getLiveSchedule(),
        getAssetSummaries(),
        collectOperatorHealth(),
    ]);
    const timezone = schedule.day?.timezone ?? PLAYOUT_TIMEZONE;
    const nowSeconds = secondsSinceMidnightInTimezone(new Date(), timezone);
    const active = findActiveSchedule(schedule, nowSeconds);
    const health = analyzeSchedule(schedule, schedule.blocks);
    const readyAssets = assets.filter((asset) => asset.status === 'ready').length;
    const needsFix = assets.length - readyAssets;
    const isLive = schedule.day?.status === 'active';

    return (
        <AdminShell
            title="Dashboard"
            description="Day-start overview. Use Operate during broadcast."
            actions={
                <ButtonLink href={isLive || active.block ? '/admin/operate' : '/admin/program'}>
                    {isLive || active.block ? 'Open Operate' : 'Open Program'}
                </ButtonLink>
            }
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
                    detail={
                        active.block
                            ? `On air: ${active.block.title}`
                            : isLive
                              ? 'Day active — open control room'
                              : 'Live control room'
                    }
                    tone="operate"
                />
                <ModeCard
                    href="/admin/program"
                    icon={CalendarDays}
                    title="Program"
                    detail={
                        health.criticalCount
                            ? `${health.criticalCount} critical schedule issues`
                            : `${schedule.blocks.length} blocks today`
                    }
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

            <section className="mt-5 rounded-md border border-line bg-surface-elevated-2 p-4 text-sm">
                <p className="text-xs font-bold uppercase tracking-wide text-muted">Today</p>
                <p className="mt-2 font-semibold">{schedule.day?.title ?? `Programming ${today}`}</p>
                <p className="mt-1 text-muted">
                    {today} · Day {schedule.day?.status ?? 'missing'} · Health{' '}
                    {health.criticalCount ? `${health.criticalCount} critical` : 'clear'}
                </p>
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
