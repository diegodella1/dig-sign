'use client';

import { useOutputMonitor } from '@/hooks/use-output-monitor';

import type { OutputMonitorPayload } from '@/components/broadcast/types';

const DRIFT_WARN_SECONDS = 3;

export function LiveAlertsPanel({ initial }: { initial: OutputMonitorPayload }) {
    const { payload, clientSeconds, error } = useOutputMonitor(initial);
    const nowMs = new Date(payload.generatedAt).getTime();
    const alerts: Array<{ tone: 'danger' | 'warn'; title: string; detail: string }> = [];

    if (error) {
        alerts.push({ tone: 'danger', title: 'Monitor offline', detail: error });
    }

    if (Math.abs(clientSeconds - payload.serverSeconds) >= DRIFT_WARN_SECONDS) {
        alerts.push({
            tone: 'warn',
            title: 'Clock drift',
            detail: `Client/server skew is ${Math.abs(clientSeconds - payload.serverSeconds)}s. Reload output if playback looks wrong.`,
        });
    }

    if (payload.mediaError) {
        alerts.push({ tone: 'danger', title: 'Media error', detail: payload.mediaError });
    }

    if (payload.asset?.playbackReadinessStatus === 'failed') {
        alerts.push({
            tone: 'danger',
            title: 'Playback failed',
            detail: payload.asset.playbackError ?? 'Asset playback check failed.',
        });
    }

    if (payload.fallbackReason && payload.fallbackReason !== 'normal') {
        alerts.push({
            tone: 'warn',
            title: 'Fallback active',
            detail: payload.fallbackReason,
        });
    }

    if (payload.override?.expiresAt) {
        const expires = new Date(payload.override.expiresAt);

        if (!Number.isNaN(expires.getTime()) && expires.getTime() < nowMs + 15 * 60_000) {
            alerts.push({
                tone: 'warn',
                title: 'Override expiring',
                detail: `${payload.override.label ?? payload.override.sourceType} expires soon.`,
            });
        }
    }

    if (!payload.day) {
        alerts.push({
            tone: 'warn',
            title: 'No program day',
            detail: "Create and activate today's schedule before going live.",
        });
    }

    if (
        payload.block &&
        payload.block.durationSeconds > 0 &&
        payload.block.elapsedInBlock >= payload.block.durationSeconds - 2
    ) {
        alerts.push({
            tone: 'warn',
            title: 'Block ending',
            detail: `${payload.block.title} is about to roll.`,
        });
    }

    if (!payload.block && payload.day?.status === 'active') {
        alerts.push({
            tone: 'warn',
            title: 'Schedule gap',
            detail: 'Day is active but no block covers this time. Fallback should be visible.',
        });
    }

    if (!alerts.length) {
        return null;
    }

    return (
        <section className="space-y-2" aria-live="assertive">
            {alerts.map((alert) => (
                <div
                    key={`${alert.title}-${alert.detail}`}
                    className={
                        alert.tone === 'danger'
                            ? 'rounded-md border border-danger-line bg-danger-soft px-4 py-3 text-sm text-danger-strong'
                            : 'rounded-md border border-warn-line bg-warn-soft px-4 py-3 text-sm text-warn-strong'
                    }
                >
                    <p className="font-semibold">{alert.title}</p>
                    <p className="mt-0.5 text-xs opacity-90">{alert.detail}</p>
                </div>
            ))}
        </section>
    );
}
