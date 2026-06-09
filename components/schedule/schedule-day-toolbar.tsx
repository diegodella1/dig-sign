import Link from 'next/link';
import type { ReactNode } from 'react';

import { StatusPill } from '@/components/ui/status-pill';
import { formatTimecode } from '@/lib/helpers/time';

type ScheduleDayToolbarProps = {
    date: string;
    timezone: string;
    dayStatus: string;
    readyBlocks: number;
    totalBlocks: number;
    totalScheduledSeconds: number;
    healthCriticalCount: number;
    healthWarnCount: number;
    fallbackPolicyLabel?: string;
    fallbackPolicyReady?: boolean;
    actions?: ReactNode;
};

export function ScheduleDayToolbar({
    date,
    timezone,
    dayStatus,
    readyBlocks,
    totalBlocks,
    totalScheduledSeconds,
    healthCriticalCount,
    healthWarnCount,
    fallbackPolicyLabel = 'Not ready',
    fallbackPolicyReady = false,
    actions,
}: ScheduleDayToolbarProps) {
    const hasIssues = healthCriticalCount > 0 || healthWarnCount > 0;

    return (
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-4 py-2.5">
            <div className="flex min-w-0 flex-wrap items-center gap-2 text-sm">
                <StatusPill status={dayStatus} />
                <span className="font-semibold tabular-nums">
                    {totalBlocks} {totalBlocks === 1 ? 'block' : 'blocks'}
                </span>
                <span className="text-muted">·</span>
                <span className="text-muted tabular-nums">
                    {formatTimecode(totalScheduledSeconds)}
                </span>
                <span className="text-muted">·</span>
                <span className="text-muted tabular-nums">
                    {readyBlocks}/{totalBlocks} ready
                </span>
                <span className="hidden text-xs text-muted sm:inline">
                    · {date} · {timezone}
                </span>
            </div>
            <div className="flex flex-wrap items-center gap-2">
                <a
                    href="/admin/program/fallback"
                    className={[
                        'rounded-md border px-2 py-1 text-xs font-semibold',
                        fallbackPolicyReady
                            ? 'border-success-line bg-success-soft text-success-strong'
                            : 'border-warn-line bg-warn-soft text-warn-strong',
                    ].join(' ')}
                >
                    Fallback: {fallbackPolicyLabel}
                </a>
                {actions}
                {hasIssues ? (
                    <a
                        href="#schedule-health"
                        className={
                            healthCriticalCount
                                ? 'rounded-md bg-danger-soft px-2 py-1 text-xs font-semibold text-danger-strong'
                                : 'rounded-md bg-warn-soft px-2 py-1 text-xs font-semibold text-warn-strong'
                        }
                    >
                        {healthCriticalCount
                            ? `${healthCriticalCount} critical`
                            : `${healthWarnCount} warnings`}
                    </a>
                ) : null}
                {dayStatus !== 'active' ? (
                    <Link href="/admin/program" className="btn-primary min-h-8 px-3 text-xs">
                        Activate in Program
                    </Link>
                ) : (
                    <Link href="/admin/operate" className="btn-primary min-h-8 px-3 text-xs">
                        Open Operate
                    </Link>
                )}
            </div>
        </div>
    );
}
