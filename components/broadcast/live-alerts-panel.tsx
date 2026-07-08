'use client';

import { useOutputMonitor } from '@/hooks/use-output-monitor';

import type { SignageMonitorPayload } from '@/components/broadcast/types';

const DRIFT_WARN_SECONDS = 3;

export function LiveAlertsPanel({ initial }: { initial: SignageMonitorPayload }) {
    const { payload, clientSeconds, error } = useOutputMonitor(initial);
    const alerts: Array<{ tone: 'danger' | 'warn'; title: string; detail: string }> = [];

    if (error) {
        alerts.push({ tone: 'danger', title: 'Monitor offline', detail: error });
    }

    const referenceSeconds = payload.screens[0]?.serverSeconds ?? clientSeconds;

    if (Math.abs(clientSeconds - referenceSeconds) >= DRIFT_WARN_SECONDS) {
        alerts.push({
            tone: 'warn',
            title: 'Clock drift',
            detail: `Client/server skew is ${Math.abs(clientSeconds - referenceSeconds)}s. Reload players if playback looks wrong.`,
        });
    }

    for (const screen of payload.screens) {
        if (screen.mediaError) {
            alerts.push({
                tone: 'danger',
                title: `${screen.name}: output issue`,
                detail: screen.mediaError,
            });
        }

        if (!screen.playlistId) {
            alerts.push({
                tone: 'warn',
                title: `${screen.name}: no playlist`,
                detail: 'Assign a day rule or fallback playlist on the screen settings page.',
            });
        }

        if (screen.playlistId && screen.outputKind === 'fallback') {
            alerts.push({
                tone: 'warn',
                title: `${screen.name}: fallback slate`,
                detail: screen.reason ?? 'Playlist empty or not ready.',
            });
        }
    }

    if (!payload.screens.length) {
        alerts.push({
            tone: 'warn',
            title: 'No screens',
            detail: 'Create at least one screen before deploying players.',
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
