import { secondsSinceMidnightInTimezone } from '@/lib/helpers/time';

export type ChannelStateBase = {
    serverSeconds: number;
    generatedAt: string;
};

export function fallbackState(reason: string, base?: ChannelStateBase) {
    return {
        kind: 'fallback' as const,
        signature: `fallback:${reason}`,
        reason,
        title: 'Dig-Sign fallback',
        serverSeconds: base?.serverSeconds ?? secondsSinceMidnightInTimezone(),
        generatedAt: base?.generatedAt ?? new Date().toISOString(),
        backgroundMusic: null,
    };
}
