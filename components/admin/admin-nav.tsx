'use client';

import { CalendarDays, PackageOpen, RadioTower, Settings } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

import type { LucideIcon } from 'lucide-react';

type NavItem = {
    label: string;
    href: string;
    icon: LucideIcon;
    match?: 'exact';
    activePaths?: string[];
};

export const primaryNavItems: NavItem[] = [
    {
        label: 'Operate',
        href: '/admin/operate',
        icon: RadioTower,
        activePaths: ['/admin/output'],
    },
    {
        label: 'Prepare',
        href: '/admin/prepare',
        icon: PackageOpen,
        activePaths: [
            '/admin/assets',
            '/admin/vimeo',
            '/admin/slides',
            '/admin/guests',
            '/admin/music',
        ],
    },
    {
        label: 'Program',
        href: '/admin/program',
        icon: CalendarDays,
        activePaths: ['/admin/calendar', '/admin/schedule'],
    },
    {
        label: 'Admin',
        href: '/admin/settings',
        icon: Settings,
        activePaths: ['/admin/health', '/admin/runbook', '/admin/audit'],
    },
];

export function AdminNav({ mobile = false }: { mobile?: boolean }) {
    const pathname = usePathname();
    const activeHref = findActiveHref(pathname);

    if (mobile) {
        return (
            <nav
                className="mt-2 flex max-w-full gap-1 overflow-x-auto pb-1 md:hidden"
                aria-label="Admin sections"
            >
                {primaryNavItems.map(({ label, href, icon: Icon }) => {
                    const active = href === activeHref;

                    return (
                        <Link
                            key={href}
                            href={href}
                            aria-current={active ? 'page' : undefined}
                            aria-label={label}
                            title={label}
                            className={[
                                'inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-md border',
                                active
                                    ? 'border-accent-positive bg-surface-selected-positive text-accent-positive'
                                    : 'border-line bg-surface text-muted',
                            ].join(' ')}
                        >
                            <Icon size={18} aria-hidden="true" />
                        </Link>
                    );
                })}
            </nav>
        );
    }

    return (
        <nav className="mt-6 flex flex-col items-center gap-1" aria-label="Admin sections">
            {primaryNavItems.map((item) => (
                <NavIconLink key={item.href} item={item} active={item.href === activeHref} />
            ))}
        </nav>
    );
}

function NavIconLink({ item, active }: { item: NavItem; active: boolean }) {
    const Icon = item.icon;

    return (
        <Link
            href={item.href}
            aria-current={active ? 'page' : undefined}
            aria-label={item.label}
            title={item.label}
            className={[
                'grid h-10 w-10 place-items-center rounded-md transition-colors',
                active
                    ? 'bg-surface-selected-positive text-accent-positive shadow-accent-positive-glow'
                    : 'text-muted hover:bg-panel-soft hover:text-ink',
            ].join(' ')}
        >
            <Icon size={20} aria-hidden="true" />
        </Link>
    );
}

function findActiveHref(pathname: string): string | null {
    for (const item of primaryNavItems) {
        if (pathname === item.href.split('?')[0]) {
            return item.href;
        }
    }

    for (const item of primaryNavItems) {
        if (
            item.activePaths?.some(
                (path) => pathname === path || pathname.startsWith(`${path}/`),
            )
        ) {
            return item.href;
        }
    }

    for (const item of primaryNavItems) {
        if (item.match === 'exact') {
            continue;
        }
        const basePath = item.href.split('?')[0]!;

        if (pathname.startsWith(`${basePath}/`)) {
            return item.href;
        }
    }

    if (pathname === '/admin') {
        return '/admin/program';
    }

    return null;
}

export const navGroups = [{ label: 'Flow', items: primaryNavItems }];
