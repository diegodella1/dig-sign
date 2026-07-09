'use client';

import {
    Building2,
    CheckSquare,
    Clapperboard,
    Home,
    MonitorPlay,
    Music,
    PackageOpen,
    Settings,
} from 'lucide-react';
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

const vendorNavItems: NavItem[] = [
    {
        label: 'Inicio',
        href: '/admin',
        icon: Home,
        match: 'exact',
    },
    {
        label: 'Pantallas',
        href: '/admin/screens',
        icon: MonitorPlay,
        activePaths: ['/admin/screens'],
    },
    {
        label: 'Contenido',
        href: '/admin/assets',
        icon: PackageOpen,
        activePaths: ['/admin/assets', '/admin/slides'],
    },
    {
        label: 'Playlists',
        href: '/admin/playlists',
        icon: Clapperboard,
        activePaths: ['/admin/playlists'],
    },
    {
        label: 'Musica',
        href: '/admin/music',
        icon: Music,
        activePaths: ['/admin/music'],
    },
];

const globalNavItems: NavItem[] = [
    {
        label: 'Inicio',
        href: '/admin',
        icon: Home,
        match: 'exact',
    },
    {
        label: 'Vendors',
        href: '/admin/settings',
        icon: Building2,
        activePaths: ['/admin/settings'],
    },
    {
        label: 'Aprobaciones',
        href: '/admin/playlists?approval=submitted',
        icon: CheckSquare,
        activePaths: ['/admin/playlists'],
    },
    {
        label: 'Pantallas',
        href: '/admin/screens',
        icon: MonitorPlay,
        activePaths: ['/admin/screens'],
    },
    {
        label: 'Sistema',
        href: '/admin/health',
        icon: Settings,
        activePaths: ['/admin/health', '/admin/audit', '/admin/operate'],
    },
];

export const primaryNavItems: NavItem[] = vendorNavItems;

export function AdminNav({
    mobile = false,
    scopeKind = 'vendor',
}: {
    mobile?: boolean;
    scopeKind?: 'global' | 'vendor';
}) {
    const items = scopeKind === 'global' ? globalNavItems : vendorNavItems;
    const pathname = usePathname();
    const activeHref = findActiveHref(pathname, items);

    if (mobile) {
        return (
            <nav
                className="mt-3 flex max-w-full gap-2 overflow-x-auto pb-1 md:hidden"
                aria-label="Admin sections"
            >
                {items.map(({ label, href, icon: Icon }) => {
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
            {items.map((item) => (
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

function findActiveHref(pathname: string, items: NavItem[]): string | null {
    for (const item of items) {
        if (pathname === item.href.split('?')[0]) {
            return item.href;
        }
    }

    for (const item of items) {
        if (
            item.activePaths?.some((path) => pathname === path || pathname.startsWith(`${path}/`))
        ) {
            return item.href;
        }
    }

    for (const item of items) {
        if (item.match === 'exact') {
            continue;
        }
        const basePath = item.href.split('?')[0]!;

        if (pathname.startsWith(`${basePath}/`)) {
            return item.href;
        }
    }

    return null;
}

export const navGroups = [{ label: 'Flow', items: primaryNavItems }];
