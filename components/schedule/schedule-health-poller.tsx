'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

import type { ScheduleIssue } from '@/lib/scheduling/schedule-health';

type HealthPayload = {
    generatedAt: string;
    criticalCount: number;
    warnCount: number;
    issues: ScheduleIssue[];
};

export function ScheduleHealthPoller({ date, initial }: { date: string; initial: HealthPayload }) {
    const [payload, setPayload] = useState(initial);
    const [open, setOpen] = useState(
        () => typeof window !== 'undefined' && window.location.hash === '#schedule-health',
    );

    useEffect(() => {
        function onHashChange() {
            if (window.location.hash === '#schedule-health') {
                setOpen(true);
            }
        }

        window.addEventListener('hashchange', onHashChange);

        return () => window.removeEventListener('hashchange', onHashChange);
    }, []);

    useEffect(() => {
        let cancelled = false;
        async function refresh() {
            const response = await fetch(`/api/admin/schedule/${date}/health`, {
                cache: 'no-store',
            });

            if (!response.ok) {
                return;
            }
            const next = (await response.json()) as HealthPayload;

            if (!cancelled) {
                setPayload(next);
            }
        }
        const timer = window.setInterval(() => {
            void refresh();
        }, 10_000);

        return () => {
            cancelled = true;
            window.clearInterval(timer);
        };
    }, [date]);

    if (!payload.issues.length) {
        return null;
    }

    const summaryLabel = payload.criticalCount
        ? `${payload.criticalCount} critical issue${payload.criticalCount === 1 ? '' : 's'}`
        : `${payload.warnCount} warning${payload.warnCount === 1 ? '' : 's'}`;

    return (
        <section id="schedule-health" className="border-b border-line" aria-live="polite">
            <button
                type="button"
                className="flex w-full items-center justify-between gap-2 px-4 py-2 text-left hover:bg-panel-soft"
                aria-expanded={open}
                onClick={() => setOpen((value) => !value)}
            >
                <span
                    className={
                        payload.criticalCount
                            ? 'text-sm font-semibold text-danger-strong'
                            : 'text-sm font-semibold text-warn-strong'
                    }
                >
                    {summaryLabel}
                </span>
                <span className="text-xs text-muted">{open ? 'Hide' : 'Show details'}</span>
            </button>
            {open ? (
                <div className="border-t border-line">
                    {payload.issues.map((issue) => (
                        <Link
                            key={issue.id}
                            href={issue.targetHref ?? issue.actionHref ?? `/admin/schedule/${date}`}
                            className="grid gap-1 border-b border-line px-4 py-2.5 last:border-b-0 hover:bg-panel-soft"
                        >
                            <span
                                className={
                                    issue.severity === 'critical'
                                        ? 'text-sm font-semibold text-danger-strong'
                                        : 'text-sm font-semibold text-warn-strong'
                                }
                            >
                                {issue.title}
                            </span>
                            <span className="text-xs leading-5 text-muted">{issue.detail}</span>
                        </Link>
                    ))}
                </div>
            ) : null}
        </section>
    );
}
