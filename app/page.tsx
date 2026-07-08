import {
    Activity,
    BookOpen,
    BriefcaseBusiness,
    MonitorPlay,
    PackageOpen,
    RadioTower,
    Settings,
} from 'lucide-react';
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
            detail: 'Uploads, public URLs, music, and plates.',
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
        <main className="min-h-screen bg-surface-elevated-1 text-ink">
            <section className="mx-auto grid min-h-screen max-w-7xl gap-8 px-6 py-8 lg:grid-cols-[1fr_360px]">
                <div className="flex flex-col justify-between border-2 border-line bg-surface p-6 shadow-[8px_8px_0_#1a1a1a] md:p-8">
                    <header>
                        <p className="eyebrow text-accent-live">Command Center</p>
                        <h1 className="mt-3 max-w-4xl font-display text-6xl font-bold uppercase leading-[0.95] md:text-8xl">
                            DigSign
                        </h1>
                        <p className="mt-5 max-w-2xl text-base font-medium leading-7 text-muted">
                            Operations console for multi-screen digital signage. Build playlists,
                            assign them by day, and open a player URL on each display.
                        </p>
                    </header>

                    <div className="mt-10 flex flex-wrap gap-3">
                        <Link className="btn-primary" href="/admin/login">
                            Operator login
                        </Link>
                        <Link className="btn-secondary" href="/manual">
                            <BookOpen size={16} className="mr-2 inline" aria-hidden="true" />
                            Manual
                        </Link>
                        <Link className="btn-secondary" href="/business">
                            <BriefcaseBusiness
                                size={16}
                                className="mr-2 inline"
                                aria-hidden="true"
                            />
                            Stack & Business
                        </Link>
                    </div>
                </div>

                <aside className="grid content-start gap-4">
                    <div className="surface-card bg-surface-selected-positive p-5">
                        <div className="flex items-center gap-3">
                            <Activity size={30} aria-hidden="true" />
                            <div>
                                <p className="eyebrow text-ink">System</p>
                                <p className="font-display text-2xl font-bold uppercase">
                                    Ready to Operate
                                </p>
                            </div>
                        </div>
                    </div>
                    {modes.map(({ label, href, detail, icon: Icon }) => (
                        <Link
                            key={href}
                            href={href}
                            className="surface-card group flex min-h-32 flex-col justify-between p-5 hover:-translate-x-1 hover:-translate-y-1 hover:bg-panel-soft hover:shadow-[6px_6px_0_#1a1a1a]"
                        >
                            <div className="flex items-center justify-between gap-3">
                                <Icon size={26} aria-hidden="true" />
                                <span className="border-2 border-line bg-surface-selected-positive px-2 py-1 font-headline text-[10px] font-bold uppercase">
                                    Module
                                </span>
                            </div>
                            <div>
                                <h2 className="font-display text-xl font-bold uppercase">
                                    {label}
                                </h2>
                                <p className="mt-1 text-sm font-medium text-muted">{detail}</p>
                            </div>
                        </Link>
                    ))}
                </aside>
            </section>
        </main>
    );
}
