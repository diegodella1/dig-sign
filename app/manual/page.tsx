import {
    BadgeCheck,
    BookOpen,
    Building2,
    ListChecks,
    MonitorPlay,
    Music,
    PackageOpen,
    RadioTower,
    Shield,
} from 'lucide-react';
import Link from 'next/link';

const architecture = [
    {
        title: 'Super admin',
        body: 'Sees the whole network: vendors, screens, playlists, assets, music, health and audit.',
        items: ['Creates vendors', 'Creates operators', 'Approves vendor playlists'],
    },
    {
        title: 'Vendor workspace',
        body: 'Each vendor works in an isolated inventory. Vendors do not share assets, playlists, screens or music.',
        items: ['My assets', 'My playlists', 'My music', 'My screens'],
    },
    {
        title: 'Output model',
        body: 'A screen plays one approved content playlist by assignment, then falls back to an approved fallback playlist.',
        items: ['Horizontal 16:9', 'Vertical 9:16', 'Player URL per screen'],
    },
];

const workflow = [
    'Super admin creates the vendor and assigns operator access.',
    'Vendor uploads images/videos, adds YouTube URLs, or registers public image/video URLs.',
    'Vendor uploads its own music and selects what it wants to play.',
    'Vendor builds a horizontal or vertical playlist. These are separate targets.',
    'Vendor submits the playlist for approval.',
    'Super admin reviews, approves or rejects. Only approved playlists can go live.',
    'Vendor or super admin assigns approved playlists to matching screens.',
    'Operate monitors player state, fallback output, errors and audit activity.',
];

const contentRules = [
    'Content playlists support YouTube URLs, uploaded image/video media, Vimeo public URLs, and public image/video URLs.',
    'Vendor edits return the playlist to draft. A changed playlist must be submitted and approved again.',
    'A playlist must have at least one item before submit, approval or screen assignment.',
    'Vertical screens only accept vertical playlists. Horizontal screens only accept horizontal playlists.',
    'Music is vendor-scoped. Each vendor uploads and plays its own audio independently.',
    'Output only renders playlists with status ready and approval approved.',
];

const modules = [
    {
        title: 'Dashboard',
        href: '/admin',
        icon: Building2,
        body: 'Role-aware landing. Vendors get their workspace; super admins get network metrics and pending approvals.',
    },
    {
        title: 'Prepare',
        href: '/admin/prepare',
        icon: PackageOpen,
        body: 'Entry point for uploads, public URLs, plates and content preparation.',
    },
    {
        title: 'Playlists',
        href: '/admin/playlists',
        icon: ListChecks,
        body: 'Build content loops, submit for approval, and review vendor submissions.',
    },
    {
        title: 'Music',
        href: '/admin/music',
        icon: Music,
        body: 'Vendor-scoped audio library and playback selection.',
    },
    {
        title: 'Screens',
        href: '/admin/screens',
        icon: MonitorPlay,
        body: 'Create horizontal or vertical screens, configure fallback playlists and assignments.',
    },
    {
        title: 'Operate',
        href: '/admin/operate',
        icon: RadioTower,
        body: 'Live monitor for player URLs, active playlists, fallback states, health and audit trail.',
    },
];

const checks = [
    'Health page is ok before live operation.',
    'Every screen has the intended orientation.',
    'Every assigned playlist is approved and has playable items.',
    'Fallback playlist exists for every production screen.',
    'Music output matches the vendor and venue.',
    'Player URL opens on the target device before handoff.',
];

export default function ManualPage() {
    return (
        <main className="min-h-screen bg-surface-elevated-1 text-ink">
            <div className="mx-auto max-w-6xl px-6 py-8 md:py-10">
                <header className="border-2 border-line bg-surface p-6 shadow-[8px_8px_0_#1a1a1a] md:p-8">
                    <div className="flex flex-wrap gap-3">
                        <Link href="/" className="btn-secondary">
                            Back
                        </Link>
                        <Link href="/business" className="btn-secondary">
                            Stack & Business
                        </Link>
                    </div>
                    <p className="eyebrow mt-8 text-accent-live">DigSign Manual</p>
                    <h1 className="mt-3 max-w-4xl font-display text-5xl font-bold uppercase leading-none md:text-7xl">
                        Multi-Vendor Signage Operations
                    </h1>
                    <p className="mt-5 max-w-3xl text-base font-medium leading-7 text-muted">
                        This is the current operating model for DigSign: one super admin controls
                        the network, vendors manage isolated content, and only approved playlists
                        can reach production screens.
                    </p>
                </header>

                <section className="mt-6 grid gap-4 md:grid-cols-3">
                    <ManualMetric label="Tenant Model" value="Vendor isolated" />
                    <ManualMetric label="Approval Gate" value="Required" />
                    <ManualMetric label="Screen Targets" value="16:9 + 9:16" />
                </section>

                <section className="mt-8 grid gap-5 lg:grid-cols-3">
                    {architecture.map((item) => (
                        <article key={item.title} className="surface-card p-5">
                            <Shield size={26} aria-hidden="true" />
                            <h2 className="mt-4 font-display text-2xl font-bold uppercase">
                                {item.title}
                            </h2>
                            <p className="mt-3 text-sm font-medium leading-6 text-muted">
                                {item.body}
                            </p>
                            <ul className="mt-4 grid gap-2 text-sm font-semibold">
                                {item.items.map((entry) => (
                                    <li key={entry} className="border-l-4 border-line pl-3">
                                        {entry}
                                    </li>
                                ))}
                            </ul>
                        </article>
                    ))}
                </section>

                <section className="mt-10 grid gap-8 lg:grid-cols-[1fr_360px]">
                    <div>
                        <div className="flex items-center gap-3">
                            <BookOpen size={24} aria-hidden="true" />
                            <h2 className="font-display text-3xl font-bold uppercase">
                                Operating Flow
                            </h2>
                        </div>
                        <ol className="mt-5 grid gap-3">
                            {workflow.map((step, index) => (
                                <li
                                    key={step}
                                    className="flex gap-3 border-2 border-line bg-surface p-4 shadow-[3px_3px_0_#1a1a1a]"
                                >
                                    <span className="grid h-8 w-8 shrink-0 place-items-center border-2 border-line bg-surface-selected-positive font-headline text-sm font-bold">
                                        {index + 1}
                                    </span>
                                    <span className="text-sm font-medium leading-6 text-muted">
                                        {step}
                                    </span>
                                </li>
                            ))}
                        </ol>
                    </div>

                    <aside className="border-2 border-line bg-surface-selected-positive p-5 shadow-[6px_6px_0_#1a1a1a]">
                        <BadgeCheck size={28} aria-hidden="true" />
                        <h2 className="mt-4 font-display text-2xl font-bold uppercase">
                            Live Checklist
                        </h2>
                        <ul className="mt-4 grid gap-3">
                            {checks.map((check) => (
                                <li key={check} className="text-sm font-semibold leading-6">
                                    {check}
                                </li>
                            ))}
                        </ul>
                    </aside>
                </section>

                <section className="mt-10">
                    <h2 className="font-display text-3xl font-bold uppercase">Content Rules</h2>
                    <div className="mt-5 grid gap-3 md:grid-cols-2">
                        {contentRules.map((rule) => (
                            <div key={rule} className="surface-card p-4 text-sm font-medium">
                                {rule}
                            </div>
                        ))}
                    </div>
                </section>

                <section className="mt-10">
                    <h2 className="font-display text-3xl font-bold uppercase">Admin Modules</h2>
                    <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                        {modules.map((module) => (
                            <Link
                                key={module.href}
                                href={module.href}
                                className="surface-card group flex min-h-44 flex-col justify-between p-5 hover:-translate-x-1 hover:-translate-y-1 hover:bg-panel-soft hover:shadow-[6px_6px_0_#1a1a1a]"
                            >
                                <span>
                                    <module.icon size={28} aria-hidden="true" />
                                    <span className="mt-4 block font-display text-xl font-bold uppercase">
                                        {module.title}
                                    </span>
                                    <span className="mt-2 block text-sm font-medium leading-6 text-muted">
                                        {module.body}
                                    </span>
                                </span>
                                <span className="mt-4 font-headline text-xs font-bold uppercase text-accent-live">
                                    Open
                                </span>
                            </Link>
                        ))}
                    </div>
                </section>
            </div>
        </main>
    );
}

function ManualMetric({ label, value }: { label: string; value: string }) {
    return (
        <section className="border-2 border-line bg-surface p-4 shadow-[4px_4px_0_#1a1a1a]">
            <p className="eyebrow text-muted">{label}</p>
            <p className="mt-2 font-display text-2xl font-bold uppercase">{value}</p>
        </section>
    );
}
