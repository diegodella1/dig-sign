import { secondsSinceMidnightInTimezone } from '@/lib/helpers/time';

export type ChannelStateBase = {
    serverSeconds: number;
    generatedAt: string;
    screenOrientation?: 'horizontal' | 'vertical';
};

export function fallbackState(reason: string, base?: ChannelStateBase) {
    return {
        kind: 'fallback' as const,
        signature: `fallback:${reason}`,
        reason,
        title: 'Dig-Sign fallback',
        serverSeconds: base?.serverSeconds ?? secondsSinceMidnightInTimezone(),
        generatedAt: base?.generatedAt ?? new Date().toISOString(),
        screenOrientation: base?.screenOrientation ?? 'horizontal',
        backgroundMusic: null,
    };
}
