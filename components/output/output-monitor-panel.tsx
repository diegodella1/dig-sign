'use client';

import { useOutputMonitor } from '@/hooks/use-output-monitor';

import { formatTimecode } from '@/lib/helpers/time';

import type { OutputMonitorPayload } from '@/components/broadcast/types';

export function OutputMonitorPanel({ initial }: { initial: OutputMonitorPayload }) {
    const { payload, clientSeconds, error } = useOutputMonitor(initial);
    const drift = Math.abs(clientSeconds - payload.serverSeconds);

    return (
        <section className="grid gap-4">
            <div>
                <p className="eyebrow">Browser output</p>
                <p className="mt-1 text-sm text-muted">
                    Open `/output/live`, click Start Output once, and capture the browser in
                    OBS/vMix.
                </p>
            </div>

            {error ? (
                <p className="rounded-md border border-danger-line bg-danger-soft px-3 py-2 text-sm text-danger-strong">
                    {error}
                </p>
            ) : null}

            <dl className="grid gap-2 sm:grid-cols-2">
                <MonitorRow label="Generated" value={new Date(payload.generatedAt).toLocaleString()} />
                <MonitorRow label="Timezone" value={payload.timezone} />
                <MonitorRow label="Server clock" value={formatTimecode(payload.serverSeconds)} />
                <MonitorRow label="Client clock" value={formatTimecode(clientSeconds)} />
                <MonitorRow label="Drift" value={`${drift}s`} tone={drift >= 3 ? 'warn' : 'ok'} />
                <MonitorRow
                    label="Day"
                    value={
                        payload.day
                            ? `${payload.day.airDate} (${payload.day.status})`
                            : 'None'
                    }
                />
                <MonitorRow
                    label="Block"
                    value={
                        payload.block
                            ? `${payload.block.title} · ${formatTimecode(payload.block.elapsedInBlock)} / ${formatTimecode(payload.block.durationSeconds)}`
                            : 'None'
                    }
                />
                <MonitorRow
                    label="Asset"
                    value={payload.asset ? `${payload.asset.title} (${payload.asset.sourceType})` : 'None'}
                />
                <MonitorRow
                    label="Fallback"
                    value={payload.fallback?.title ?? payload.fallbackReason ?? 'None'}
                />
                <MonitorRow
                    label="Override"
                    value={payload.override?.label ?? payload.override?.sourceType ?? 'None'}
                />
            </dl>
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
            <dt className="text-[10px] font-bold uppercase text-muted">{label}</dt>
            <dd className={`mt-1 font-semibold ${toneClass}`}>{value}</dd>
        </div>
    );
}
