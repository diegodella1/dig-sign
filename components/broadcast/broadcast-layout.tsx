import type { ReactNode } from 'react';

export function BroadcastLayout({
    main,
    rail,
}: {
    main: ReactNode;
    rail: ReactNode;
}) {
    return (
        <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_240px]">
            <div className="order-2 min-w-0 space-y-5 xl:order-1">{main}</div>
            <div className="order-1 min-w-0 xl:order-2 xl:sticky xl:top-24 xl:self-start">{rail}</div>
        </div>
    );
}
