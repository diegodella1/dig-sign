import Link from 'next/link';

import { StatusBadge } from '@/components/broadcast/status-badge';

export function RunbookProgress({
    date,
    checkedCount,
    totalCount,
    criticalOpen,
}: {
    date: string;
    checkedCount: number;
    totalCount: number;
    criticalOpen: string[];
}) {
    const tone = criticalOpen.length ? 'warn' : checkedCount === totalCount ? 'ok' : 'neutral';

    return (
        <section className="rounded-md border border-line bg-surface-elevated-2 p-4">
            <header className="flex items-center justify-between gap-2">
                <h3 className="text-[10px] font-bold uppercase tracking-wide text-muted">Runbook</h3>
                <StatusBadge tone={tone === 'ok' ? 'ok' : tone === 'warn' ? 'warn' : 'idle'}>
                    {checkedCount}/{totalCount}
                </StatusBadge>
            </header>
            {criticalOpen.length ? (
                <ul className="mt-2 space-y-1 text-xs text-warn-strong">
                    {criticalOpen.slice(0, 3).map((item) => (
                        <li key={item}>· {item}</li>
                    ))}
                </ul>
            ) : (
                <p className="mt-2 text-xs text-muted">Critical preflight items complete.</p>
            )}
            <Link
                href={`/admin/runbook/${date}`}
                className="mt-3 inline-block text-xs font-semibold text-accent-positive hover:underline"
            >
                Open runbook
            </Link>
        </section>
    );
}
