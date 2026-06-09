import { RadioTower, PackageOpen, CalendarDays, Settings, BookOpen } from 'lucide-react';
import Link from 'next/link';

export default function HomePage() {
    const modes = [
        {
            label: 'Operate',
            href: '/admin/operate',
            detail: 'Control room — on-air signal, next blocks, health, recovery.',
            icon: RadioTower,
        },
        {
            label: 'Prepare',
            href: '/admin/prepare',
            detail: 'Media, music, guests, plates, and Vimeo import.',
            icon: PackageOpen,
        },
        {
            label: 'Program',
            href: '/admin/program',
            detail: 'Calendar, rundown, loops, fallback, and day activation.',
            icon: CalendarDays,
        },
        {
            label: 'Admin',
            href: '/admin/settings',
            detail: 'Settings, health, runbook, audit, and capture setup.',
            icon: Settings,
        },
    ];

    return (
        <main className="mx-auto flex min-h-screen max-w-4xl flex-col gap-8 px-6 py-10">
            <header>
                <p className="eyebrow text-accent-positive">Roxom TV</p>
                <h1 className="mt-2 text-4xl font-semibold tracking-normal">Playout Manager</h1>
                <p className="mt-3 max-w-2xl text-muted">
                    Broadcast operations console for linear playout. Start in Operate during live
                    hours; use Prepare and Program before air.
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
