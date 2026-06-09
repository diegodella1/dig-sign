import Link from 'next/link';

export function AuditTail({
    events,
}: {
    events: Array<{ id: string; action: string; createdAt: string; actor: string | null }>;
}) {
    return (
        <section className="rounded-md border border-line bg-surface-elevated-2 p-4">
            <header className="flex items-center justify-between gap-2">
                <h3 className="text-[10px] font-bold uppercase tracking-wide text-muted">Recent audit</h3>
                <Link href="/admin/audit" className="text-xs font-semibold text-accent-positive hover:underline">
                    View all
                </Link>
            </header>
            {events.length ? (
                <ul className="mt-2 space-y-2 text-xs">
                    {events.map((event) => (
                        <li key={event.id} className="border-b border-line pb-2 last:border-0">
                            <p className="font-semibold text-ink">{event.action}</p>
                            <p className="text-muted">
                                {event.actor ?? 'system'} · {formatAuditTime(event.createdAt)}
                            </p>
                        </li>
                    ))}
                </ul>
            ) : (
                <p className="mt-2 text-xs text-muted">No recent events.</p>
            )}
        </section>
    );
}

function formatAuditTime(value: string) {
    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return value;
    }

    return date.toLocaleString(undefined, {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
}
