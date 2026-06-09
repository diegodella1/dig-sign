'use client';

import { useEffect, useState } from 'react';

import type { OutputMonitorPayload } from '@/components/broadcast/types';

const DEFAULT_POLL_MS = 2000;

export function useOutputMonitor(initial: OutputMonitorPayload, pollMs = DEFAULT_POLL_MS) {
    const [payload, setPayload] = useState(initial);
    const [clientSeconds, setClientSeconds] = useState(initial.serverSeconds);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const clock = window.setInterval(() => {
            setClientSeconds((value) => value + 1);
        }, 1000);

        return () => window.clearInterval(clock);
    }, []);

    useEffect(() => {
        let cancelled = false;

        const refresh = async () => {
            try {
                const response = await fetch('/api/output/monitor', { cache: 'no-store' });

                if (!response.ok) {
                    throw new Error(`Monitor ${response.status}`);
                }

                const next = (await response.json()) as OutputMonitorPayload;

                if (!cancelled) {
                    setPayload(next);
                    setClientSeconds(next.serverSeconds);
                    setError(null);
                }
            } catch (refreshError) {
                if (!cancelled) {
                    setError(
                        refreshError instanceof Error
                            ? refreshError.message
                            : 'Monitor unavailable',
                    );
                }
            }
        };

        const timer = window.setInterval(refresh, pollMs);
        void refresh();

        return () => {
            cancelled = true;
            window.clearInterval(timer);
        };
    }, [pollMs]);

    return { payload, clientSeconds, error };
}
