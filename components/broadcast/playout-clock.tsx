'use client';

import { useEffect, useState } from 'react';

import { formatPlayoutTimeLabel } from '@/lib/helpers/time';

export function PlayoutClock({
    timezone,
    initialSeconds,
}: {
    timezone: string;
    initialSeconds: number;
}) {
    const [offset, setOffset] = useState(0);
    const seconds = initialSeconds + offset;

    useEffect(() => {
        const timer = window.setInterval(() => {
            setOffset((value) => value + 1);
        }, 1000);

        return () => window.clearInterval(timer);
    }, []);

    return (
        <time
            className="font-mono text-sm font-semibold tabular-nums text-ink"
            dateTime={formatPlayoutTimeLabel(seconds)}
        >
            {formatPlayoutTimeLabel(seconds)}
            <span className="ml-1.5 text-[10px] font-bold uppercase text-muted">{timezone}</span>
        </time>
    );
}
