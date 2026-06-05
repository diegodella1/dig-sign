'use client';

import { useEffect, useState } from 'react';

import { StatusBadge } from '@/components/broadcast/status-badge';
import { formatTimecode } from '@/lib/helpers/time';

export function OnAirPanel({
    isLive,
    blockTitle,
    sourceLabel,
    elapsedInBlock,
    durationSeconds,
    dayStatus,
}: {
    isLive: boolean;
    blockTitle: string | null;
    sourceLabel: string;
    elapsedInBlock: number;
    durationSeconds: number;
    dayStatus: string;
}) {
    const [tick, setTick] = useState(0);
    const elapsed = Math.min(durationSeconds, elapsedInBlock + tick);

    useEffect(() => {
        if (!isLive || durationSeconds <= 0) {
            return;
        }
        const timer = window.setInterval(() => {
            setTick((value) => value + 1);
        }, 1000);

        return () => window.clearInterval(timer);
    }, [durationSeconds, isLive]);

    const remaining = Math.max(0, durationSeconds - elapsed);
    const pct =
        durationSeconds > 0
            ? Math.min(100, Math.max(0, Math.round((elapsed / durationSeconds) * 100)))
            : 0;

    const stateLabel = isLive ? 'On air' : dayStatus === 'active' ? 'Active · no block' : 'Idle';

    return (
        <section
            className="rounded-md border border-line bg-surface-elevated-2 p-5 md:p-6"
            aria-live="polite"
        >
            <div className="flex flex-wrap items-start justify-between gap-3">
                <StatusBadge tone={isLive ? 'live' : dayStatus === 'active' ? 'warn' : 'idle'} pulse={isLive}>
                    {stateLabel}
                </StatusBadge>
                <p className="text-xs font-semibold uppercase tracking-wide text-muted">{sourceLabel}</p>
            </div>

            <h2 className="mt-4 truncate text-2xl font-semibold tracking-tight text-ink md:text-3xl">
                {blockTitle ?? 'Nothing scheduled'}
            </h2>

            {durationSeconds > 0 ? (
                <>
                    <div className="mt-5 flex flex-wrap items-end justify-between gap-4">
                        <div>
                            <p className="text-[10px] font-bold uppercase tracking-wider text-muted">
                                Remaining
                            </p>
                            <p className="mt-1 font-mono text-3xl font-semibold tabular-nums text-accent-positive md:text-4xl">
                                {formatTimecode(remaining)}
                            </p>
                        </div>
                        <div className="text-right">
                            <p className="text-[10px] font-bold uppercase tracking-wider text-muted">
                                Elapsed
                            </p>
                            <p className="mt-1 font-mono text-lg tabular-nums text-muted">
                                {formatTimecode(elapsed)} / {formatTimecode(durationSeconds)}
                            </p>
                        </div>
                    </div>
                    <div
                        className="mt-4 h-2 w-full overflow-hidden rounded-sm bg-panel-soft"
                        role="progressbar"
                        aria-valuenow={pct}
                        aria-valuemin={0}
                        aria-valuemax={100}
                    >
                        <div
                            className="h-full bg-accent-positive transition-[width] duration-1000 ease-linear"
                            style={{ width: `${pct}%` }}
                        />
                    </div>
                </>
            ) : (
                <p className="mt-4 text-sm text-muted">No timed block in the current window.</p>
            )}
        </section>
    );
}
