'use client';

import Link from 'next/link';

import { useOutputMonitor } from '@/hooks/use-output-monitor';

import { formatTimecode } from '@/lib/helpers/time';

import type { SignageMonitorPayload } from '@/components/broadcast/types';

export function OutputMonitorPanel({ initial }: { initial: SignageMonitorPayload }) {
    const { payload, clientSeconds, error } = useOutputMonitor(initial);
    const referenceSeconds = payload.screens[0]?.serverSeconds ?? clientSeconds;
    const drift = Math.abs(clientSeconds - referenceSeconds);

    return (
        <section className="grid gap-4">
            <div>
                <p className="eyebrow">Screen output</p>
                <p className="mt-1 text-sm text-muted">
                    Open <code>/output/live/[screen]</code> on each player device. Polls every 2s.
                </p>
            </div>

            {error ? (
                <p className="rounded-md border border-danger-line bg-danger-soft px-3 py-2 text-sm text-danger-strong">
                    {error}
                </p>
            ) : null}

            <dl className="grid gap-2 sm:grid-cols-2">
                <MonitorRow label="Generated" value={new Date(payload.generatedAt).toLocaleString()} />
                <MonitorRow label="Drift" value={`${drift}s`} tone={drift >= 3 ? 'warn' : 'ok'} />
            </dl>

            <ul className="divide-y divide-line rounded-md border border-line">
                {payload.screens.map((screen) => (
                    <li key={screen.slug} className="grid gap-2 px-4 py-3 text-sm sm:grid-cols-2">
                        <div>
                            <p className="font-semibold">{screen.name}</p>
                            <p className="text-xs text-muted">
                                /output/live/{screen.slug} · {screen.timezone}
                            </p>
                        </div>
                        <div className="text-muted">
                            <p>
                                {screen.playlistName ?? 'No playlist'} · {screen.outputKind}
                            </p>
                            <p className="truncate">{screen.title}</p>
                            {screen.durationSeconds ? (
                                <p>
                                    {formatTimecode(screen.elapsedSeconds ?? 0)} /{' '}
                                    {formatTimecode(screen.durationSeconds)}
                                </p>
                            ) : null}
                        </div>
                        <div className="sm:col-span-2">
                            <Link href={`/admin/screens/${screen.slug}`} className="text-xs underline">
                                Manage screen
                            </Link>
                        </div>
                    </li>
                ))}
            </ul>
        </section>
    );
}

function MonitorRow({
    label,
    value,
    tone = 'neutral',
}: {
    label: string;
    value: string;
    tone?: 'neutral' | 'ok' | 'warn';
}) {
    const toneClass =
        tone === 'warn' ? 'text-warn' : tone === 'ok' ? 'text-success' : 'text-ink';

    return (
        <div className="rounded-md border border-line bg-panel-soft px-3 py-2">
            <dt className="text-xs font-semibold uppercase text-muted">{label}</dt>
            <dd className={`mt-1 text-sm font-medium ${toneClass}`}>{value}</dd>
        </div>
    );
}
