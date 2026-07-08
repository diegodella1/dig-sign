'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

import type { ModeSubNavItem } from '@/components/broadcast/mode-sub-nav-items';

export type { ModeSubNavItem } from '@/components/broadcast/mode-sub-nav-items';

export function ModeSubNav({ items }: { items: ModeSubNavItem[] }) {
    const pathname = usePathname();

    return (
        <nav
            className="flex max-w-full flex-wrap gap-2 border-t-2 border-line pt-3"
            aria-label="Section navigation"
        >
            {items.map((item) => {
                const active =
                    pathname === item.href ||
                    item.match?.some(
                        (path) => pathname === path || pathname.startsWith(`${path}/`),
                    );

                return (
                    <Link
                        key={item.href}
                        href={item.href}
                        aria-current={active ? 'page' : undefined}
                        className={[
                            'inline-flex min-h-8 items-center border-2 px-3 font-headline text-xs font-bold uppercase',
                            active
                                ? 'border-line bg-surface-selected-positive text-ink shadow-[2px_2px_0_#1a1a1a]'
                                : 'border-transparent text-muted hover:border-line hover:bg-panel-soft hover:text-ink',
                        ].join(' ')}
                    >
                        {item.label}
                    </Link>
                );
            })}
        </nav>
    );
}
