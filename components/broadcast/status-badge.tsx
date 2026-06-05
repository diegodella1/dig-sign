import clsx from 'clsx';
import type { ReactNode } from 'react';

import { ClearStateBadge } from '@/components/ui';

type BroadcastTone = 'live' | 'ok' | 'warn' | 'danger' | 'idle' | 'neutral';

export function StatusBadge({
    tone,
    children,
    pulse = false,
}: {
    tone: BroadcastTone;
    children: ReactNode;
    pulse?: boolean;
}) {
    if (tone === 'live') {
        return (
            <span
                className={clsx(
                    'inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-widest',
                    'bg-accent-live text-accent-live-text',
                )}
            >
                {pulse ? (
                    <span
                        className="h-1.5 w-1.5 animate-pulse rounded-full bg-accent-live-text"
                        aria-hidden="true"
                    />
                ) : null}
                {children}
            </span>
        );
    }

    const mapped =
        tone === 'ok'
            ? 'ok'
            : tone === 'warn'
              ? 'warn'
              : tone === 'danger'
                ? 'danger'
                : tone === 'idle'
                  ? 'neutral'
                  : 'info';

    return <ClearStateBadge tone={mapped}>{children}</ClearStateBadge>;
}
