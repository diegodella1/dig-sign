import Link from 'next/link';

import { StatusBadge } from '@/components/broadcast/status-badge';
import type { OperatorHealthCheck } from '@/lib/health/health-checks';

export function HealthSummary({
    status,
    checks,
}: {
    status: 'ok' | 'degraded' | 'fail';
    checks: OperatorHealthCheck[];
}) {
    const issues = checks.filter((check) => check.status !== 'ok');

    return (
        <section className="rounded-md border border-line bg-surface-elevated-2 p-4">
            <header className="flex items-center justify-between gap-2">
                <h3 className="text-xs font-bold uppercase tracking-wide text-muted">System health</h3>
                <StatusBadge
                    tone={status === 'ok' ? 'ok' : status === 'fail' ? 'danger' : 'warn'}
                >
                    {status}
                </StatusBadge>
            </header>

            {issues.length ? (
                <ul className="mt-3 space-y-2">
                    {issues.map((check) => (
                        <li
                            key={check.id}
                            className={
                                check.status === 'fail'
                                    ? 'rounded-md border border-danger-line bg-danger-soft px-3 py-2 text-sm'
                                    : 'rounded-md border border-warn-line bg-warn-soft px-3 py-2 text-sm'
                            }
                        >
                            <p className="font-semibold">{check.label}</p>
                            <p className="mt-0.5 text-xs opacity-80">{check.message}</p>
                            {check.href ? (
                                <Link
                                    href={check.href}
                                    className="mt-1 inline-block text-xs font-semibold underline"
                                >
                                    Open detail
                                </Link>
                            ) : null}
                        </li>
                    ))}
                </ul>
            ) : (
                <p className="mt-3 text-sm text-success-strong">All checks passing.</p>
            )}

            <Link
                href="/admin/health"
                className="mt-3 inline-block text-xs font-semibold text-accent-positive hover:underline"
            >
                Full health checklist
            </Link>
        </section>
    );
}
