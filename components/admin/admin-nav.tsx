'use client';

import { LayoutDashboard, MonitorPlay, PackageOpen, RadioTower, Settings } from 'lucide-react';
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
        label: 'Dashboard',
        href: '/admin',
        icon: LayoutDashboard,
        match: 'exact',
    },
    {
        label: 'Operate',
        href: '/admin/operate',
        icon: RadioTower,
        activePaths: ['/admin/operate'],
    },
    {
        label: 'Prepare',
        href: '/admin/prepare',
        icon: PackageOpen,
        activePaths: ['/admin/assets', '/admin/slides', '/admin/music'],
    },
    {
        label: 'Signage',
        href: '/admin/screens',
        icon: MonitorPlay,
        activePaths: ['/admin/playlists', '/admin/screens'],
    },
    {
        label: 'Admin',
        href: '/admin/settings',
        icon: Settings,
        activePaths: ['/admin/health', '/admin/audit'],
    },
];

export function AdminNav({ mobile = false }: { mobile?: boolean }) {
    const pathname = usePathname();
    const activeHref = findActiveHref(pathname);

    if (mobile) {
        return (
            <nav
                className="mt-3 flex max-w-full gap-2 overflow-x-auto pb-1 md:hidden"
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
                                'inline-flex min-h-10 shrink-0 items-center justify-center gap-2 border-2 px-3 font-headline text-xs font-bold uppercase',
                                active
                                    ? 'border-line bg-surface-selected-positive text-ink shadow-[3px_3px_0_#1a1a1a]'
                                    : 'border-line bg-surface text-muted hover:bg-panel-soft hover:text-ink',
                            ].join(' ')}
                        >
                            <Icon size={18} aria-hidden="true" />
                            <span>{label}</span>
                        </Link>
                    );
                })}
            </nav>
        );
    }

    return (
        <nav className="flex flex-1 flex-col gap-2" aria-label="Admin sections">
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
                'flex min-h-12 items-center gap-3 border-2 px-4 font-headline text-sm font-bold uppercase transition',
                active
                    ? 'border-line bg-surface-selected-positive text-ink shadow-[3px_3px_0_#1a1a1a]'
                    : 'border-transparent text-muted hover:border-line hover:bg-panel-soft hover:text-ink hover:shadow-[3px_3px_0_#1a1a1a]',
            ].join(' ')}
        >
            <Icon size={20} aria-hidden="true" />
            <span>{item.label}</span>
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
            item.activePaths?.some((path) => pathname === path || pathname.startsWith(`${path}/`))
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
        return '/admin/screens';
    }

    return null;
}

export const navGroups = [{ label: 'Flow', items: primaryNavItems }];
