'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

import type { ModeSubNavItem } from '@/components/broadcast/mode-sub-nav-items';

export type { ModeSubNavItem } from '@/components/broadcast/mode-sub-nav-items';

export function ModeSubNav({ items }: { items: ModeSubNavItem[] }) {
    const pathname = usePathname();

    return (
        <nav
            className="flex max-w-full flex-wrap gap-1"
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
                            'inline-flex min-h-8 items-center rounded-md px-3 text-xs font-semibold',
                            active
                                ? 'bg-surface-selected-positive text-accent-positive'
                                : 'text-muted hover:bg-panel-soft hover:text-ink',
                        ].join(' ')}
                    >
                        {item.label}
                    </Link>
                );
            })}
        </nav>
    );
}
