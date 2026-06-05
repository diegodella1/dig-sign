'use client';

import { useActiveBlock } from '@/app/hooks/use-active-block';
import { OnAirPanel } from '@/components/broadcast/on-air-panel';

export function LiveOnAirPanel({
    initialBlockTitle,
    initialSourceLabel,
    initialElapsed,
    initialDuration,
    initialDayStatus,
}: {
    initialBlockTitle: string | null;
    initialSourceLabel: string;
    initialElapsed: number;
    initialDuration: number;
    initialDayStatus: string;
}) {
    const { data } = useActiveBlock(4000);
    const active = data?.active;
    const dayStatus = data?.dayStatus ?? initialDayStatus;
    const isLive = dayStatus === 'active' && Boolean(active);

    return (
        <OnAirPanel
            key={`${active?.blockTitle ?? initialBlockTitle}-${active?.elapsedInBlock ?? initialElapsed}`}
            isLive={isLive}
            blockTitle={active?.blockTitle ?? initialBlockTitle}
            sourceLabel={initialSourceLabel}
            elapsedInBlock={active?.elapsedInBlock ?? initialElapsed}
            durationSeconds={active?.durationSeconds ?? initialDuration}
            dayStatus={dayStatus}
        />
    );
}
