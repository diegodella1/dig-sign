'use client';

import Link from 'next/link';

type ProgramActivatePanelProps = {
    today: string;
    dayStatus: string;
    hasDay: boolean;
    criticalCount: number;
    warnCount: number;
    activateAction: (formData: FormData) => Promise<void>;
    setReadyAction: (formData: FormData) => Promise<void>;
};

export function ProgramActivatePanel({
    today,
    dayStatus,
    hasDay,
    criticalCount,
    warnCount,
    activateAction,
    setReadyAction,
}: ProgramActivatePanelProps) {
    if (!hasDay) {
        return (
            <section className="surface-panel mb-4 p-4">
                <p className="text-sm font-semibold">No program day for {today}</p>
                <Link href={`/admin/schedule/${today}`} className="btn-primary mt-3 inline-flex">
                    Create rundown
                </Link>
            </section>
        );
    }

    if (dayStatus === 'active') {
        return (
            <section className="surface-panel mb-4 flex flex-wrap items-center justify-between gap-3 border border-accent-live/30 p-4">
                <p className="text-sm font-semibold text-accent-live">Day is active</p>
                <Link href="/admin/operate" className="btn-primary">
                    Open Operate
                </Link>
            </section>
        );
    }

    const blocked = criticalCount > 0;

    return (
        <section className="surface-panel mb-4 p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="min-w-0">
                    <p className="font-semibold">Go live</p>
                    {blocked ? (
                        <p className="mt-1 text-sm text-danger-strong">
                            {criticalCount} critical — fix on today&apos;s rundown first.
                        </p>
                    ) : warnCount ? (
                        <p className="mt-1 text-sm text-warn-strong">
                            {warnCount} warning{warnCount === 1 ? '' : 's'} — allow below to activate anyway.
                        </p>
                    ) : (
                        <p className="mt-1 text-sm text-muted">Mark ready, then activate.</p>
                    )}
                </div>
                <div className="flex flex-wrap gap-2">
                    {dayStatus === 'draft' ? (
                        <form action={setReadyAction}>
                            <button type="submit" className="btn-secondary">
                                Mark ready
                            </button>
                        </form>
                    ) : null}
                    <form action={activateAction} className="flex flex-wrap items-center gap-2">
                        {warnCount && !blocked ? (
                            <label className="flex items-center gap-2 text-xs">
                                <input name="allow_warnings" type="checkbox" />
                                Allow warnings
                            </label>
                        ) : null}
                        <button
                            type="submit"
                            className="btn-primary"
                            disabled={blocked}
                        >
                            Activate day
                        </button>
                    </form>
                    <Link href={`/admin/schedule/${today}`} className="btn-secondary">
                        Edit rundown
                    </Link>
                </div>
            </div>
        </section>
    );
}
