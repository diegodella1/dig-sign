import { MonitorPlay, PackageOpen, RadioTower, Settings, BookOpen } from 'lucide-react';
import Link from 'next/link';

export default function HomePage() {
    const modes = [
        {
            label: 'Operate',
            href: '/admin/operate',
            detail: 'Monitor screens, playlists on air, and player health.',
            icon: RadioTower,
        },
        {
            label: 'Prepare',
            href: '/admin/prepare',
            detail: 'Media, music, plates, and Vimeo import.',
            icon: PackageOpen,
        },
        {
            label: 'Signage',
            href: '/admin/screens',
            detail: 'Screens, content playlists, and day-based assignments.',
            icon: MonitorPlay,
        },
        {
            label: 'Admin',
            href: '/admin/settings',
            detail: 'Settings, health, audit, and capture setup.',
            icon: Settings,
        },
    ];

    return (
        <main className="mx-auto flex min-h-screen max-w-4xl flex-col gap-8 px-6 py-10">
            <header>
                <p className="eyebrow text-accent-positive">Dig-Sign</p>
                <h1 className="mt-2 text-4xl font-semibold tracking-normal">
                    Digital Signage Manager
                </h1>
                <p className="mt-3 max-w-2xl text-muted">
                    Operations console for multi-screen digital signage. Build playlists, assign them
                    by day, and open a player URL on each display.
                </p>
                <div className="mt-5 flex flex-wrap gap-2">
                    <Link className="btn-primary" href="/admin/login">
                        Operator login
                    </Link>
                    <Link className="btn-secondary" href="/manual">
                        <BookOpen size={16} className="mr-2 inline" aria-hidden="true" />
                        Manual
                    </Link>
                </div>
            </header>

            <section className="grid gap-3 sm:grid-cols-2">
                {modes.map(({ label, href, detail, icon: Icon }) => (
                    <Link
                        key={href}
                        href={href}
                        className="rounded-md border border-line bg-surface-elevated-2 p-5 hover:border-accent-positive/40"
                    >
                        <div className="flex items-center gap-2 font-semibold text-accent-positive">
                            <Icon size={18} aria-hidden="true" />
                            {label}
                        </div>
                        <p className="mt-2 text-sm text-muted">{detail}</p>
                    </Link>
                ))}
            </section>
        </main>
    );
}
