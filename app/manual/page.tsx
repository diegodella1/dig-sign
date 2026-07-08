import {
    BookOpen,
    Clapperboard,
    HeartPulse,
    MonitorPlay,
    PackageOpen,
    RadioTower,
    Shield,
} from 'lucide-react';
import Link from 'next/link';

const workflowSteps = [
    'Open Prepare and add or sync videos, graphics, slides, audio, Vimeo content and weather plates.',
    'Create screens for each physical display and assign a timezone.',
    'Build content playlists with plates and media assets in the visual loop editor.',
    'Assign playlists to screens by date range; set a fallback playlist per screen.',
    'Resolve health issues (database, storage, Vimeo, output token) before opening hours.',
    'Open Operate to monitor each screen: active playlist, current item and health.',
    'Launch `/output/live/[screenSlug]` in OBS or vMix and capture the browser source.',
    'During playback, watch the screen monitor for missing assets or fallback states.',
];

const sections = [
    {
        title: 'Prepare',
        icon: PackageOpen,
        body: 'Unified intake for uploaded media, remote URLs, music beds, Vimeo content, weather cities and reusable graphics.',
        href: '/admin/prepare',
    },
    {
        title: 'Signage',
        icon: MonitorPlay,
        body: 'Configure screens, content playlists and day-based assignments. Output follows the playlist loop, not a timed rundown.',
        href: '/admin/screens',
    },
    {
        title: 'Operate',
        icon: RadioTower,
        body: 'Screen monitor hub: health, audit trail and live output URLs for each display.',
        href: '/admin/operate',
    },
    {
        title: 'Preview',
        icon: Clapperboard,
        body: 'Open `/output/live/main` (or any screen slug) to verify playback before capture.',
        href: '/output/live/main',
    },
    {
        title: 'Health',
        icon: HeartPulse,
        body: 'Confirm environment, D1 schema, R2 storage, Vimeo token and output capture token.',
        href: '/admin/health',
    },
];

const operatorHubs = [
    {
        name: 'Prepare',
        href: '/admin/prepare',
        promise: 'Create and review content before it reaches a playlist.',
        items: ['Assets', 'Vimeo', 'Music', 'Plates'],
    },
    {
        name: 'Signage',
        href: '/admin/screens',
        promise: 'Wire screens to playlists and define fallback loops.',
        items: ['Screens', 'Playlists', 'Assignments', 'Fallback'],
    },
    {
        name: 'Operate',
        href: '/admin/operate',
        promise: 'Monitor live output and recover from problems fast.',
        items: ['Monitor', 'Health', 'Audit', 'Capture URLs'],
    },
];

const limits = [
    'Production app is live and usable with an operator present.',
    'Browser output has been confirmed through web player, vMix and OBS.',
    'Uploaded media plays through `/api/media/assets/:assetId`.',
    'Playlists rotate by item duration; there is no hour-based program grid.',
    'Weather plates can be created per city from the admin graphics surface.',
    'Weather falls back to Open-Meteo when OpenWeather is not configured.',
    'Browser audio requires one operator click after load or reload.',
    'Each screen needs a fallback playlist for off-hours or empty assignments.',
    'Secrets must stay in environment variables or encrypted settings.',
];

const recentUpdates = [
    'Hour-based schedule, runbook and program-day model removed.',
    'Screens + day-based playlist assignments are the output source.',
    'Visual playlist editor replaces JSON loop configuration.',
    'Operate page shows per-screen monitor instead of on-air rundown.',
    'Legacy routes redirect: `/admin/program` → screens, `/admin/output` → operate.',
    'Migration `0004_drop_schedule.sql` drops schedule-era D1 tables.',
];

export default function ManualPage() {
    return (
        <main className="min-h-screen bg-surface-elevated-1 text-white/90">
            <div className="mx-auto max-w-5xl px-6 py-10">
                <header className="border-b border-white/10 pb-8">
                    <Link
                        href="/"
                        className="text-sm font-semibold text-accent-positive hover:underline"
                    >
                        Back to home
                    </Link>
                    <p className="eyebrow mt-6 text-accent-positive">Dig-Sign</p>
                    <h1 className="mt-3 text-4xl font-semibold tracking-normal md:text-5xl">
                        Operator Manual
                    </h1>
                    <p className="mt-4 max-w-3xl text-base leading-7 text-white/65">
                        Dig-Sign is the control room for digital signage: prepare content, assign
                        playlists to screens, monitor playback and capture browser output in OBS or
                        vMix. This page is public; admin actions still require login.
                    </p>
                </header>

                <section className="grid gap-3 border-b border-white/10 py-6 md:grid-cols-4">
                    <ManualMetric label="Status" value="Production live" />
                    <ManualMetric label="Workflow" value="Prepare → Signage → Operate" />
                    <ManualMetric label="Output" value="Browser playout" />
                    <ManualMetric label="Backend" value="Cloudflare D1 + R2" />
                </section>

                <section className="border-b border-white/10 py-5">
                    <div className="flex flex-wrap gap-2">
                        <Link className="btn-secondary" href="/admin/prepare">
                            Prepare
                        </Link>
                        <Link className="btn-secondary" href="/admin/screens">
                            Signage
                        </Link>
                        <Link className="btn-secondary" href="/admin/operate">
                            Operate
                        </Link>
                        <Link className="btn-secondary" href="/pending">
                            Pending
                        </Link>
                        <Link className="btn-secondary" href="/notion">
                            Status
                        </Link>
                    </div>
                </section>

                <section className="border-b border-white/10 py-8">
                    <div className="flex items-center gap-3">
                        <RadioTower size={22} className="text-accent-positive" aria-hidden="true" />
                        <h2 className="text-2xl font-semibold">Operator Map</h2>
                    </div>
                    <div className="mt-5 grid gap-4 md:grid-cols-3">
                        {operatorHubs.map((hub, index) => (
                            <Link
                                key={hub.name}
                                href={hub.href}
                                className="group flex min-h-[16rem] flex-col justify-between border border-white/10 bg-surface-elevated-2 p-5 transition hover:-translate-y-0.5 hover:border-accent-positive hover:bg-surface-selected-positive"
                            >
                                <span>
                                    <span className="grid h-9 w-9 place-items-center rounded-md bg-accent-positive text-sm font-bold text-surface-elevated-1">
                                        {index + 1}
                                    </span>
                                    <span className="mt-4 block text-2xl font-semibold">
                                        {hub.name}
                                    </span>
                                    <span className="mt-2 block text-sm leading-6 text-white/65">
                                        {hub.promise}
                                    </span>
                                    <span className="mt-4 flex flex-wrap gap-2">
                                        {hub.items.map((item) => (
                                            <span
                                                key={item}
                                                className="rounded-md border border-white/10 bg-black/20 px-2 py-1 text-xs font-semibold text-white/60"
                                            >
                                                {item}
                                            </span>
                                        ))}
                                    </span>
                                </span>
                                <span className="mt-5 text-sm font-semibold text-accent-positive group-hover:underline">
                                    Open {hub.name}
                                </span>
                            </Link>
                        ))}
                    </div>
                </section>

                <section className="border-b border-white/10 py-8">
                    <h2 className="text-2xl font-semibold">Latest Updates</h2>
                    <div className="mt-5 grid gap-3 md:grid-cols-2">
                        {recentUpdates.map((item) => (
                            <div
                                key={item}
                                className="surface-panel p-4 text-sm leading-6 text-white/72"
                            >
                                {item}
                            </div>
                        ))}
                    </div>
                </section>

                <section className="py-8">
                    <div className="flex items-center gap-3">
                        <BookOpen size={22} className="text-accent-positive" aria-hidden="true" />
                        <h2 className="text-2xl font-semibold">Daily Workflow</h2>
                    </div>
                    <ol className="mt-5 grid gap-3 md:grid-cols-2">
                        {workflowSteps.map((step, index) => (
                            <li key={step} className="surface-panel flex gap-3 p-4">
                                <span className="grid h-7 w-7 shrink-0 place-items-center rounded-md bg-accent-positive text-sm font-bold text-surface-elevated-1">
                                    {index + 1}
                                </span>
                                <span className="text-sm leading-6 text-white/75">{step}</span>
                            </li>
                        ))}
                    </ol>
                </section>

                <section className="py-8">
                    <h2 className="text-2xl font-semibold">Core Surfaces</h2>
                    <div className="mt-5 grid gap-4 md:grid-cols-2">
                        {sections.map((section) => (
                            <article key={section.title} className="surface-panel p-5">
                                <div className="flex items-center justify-between gap-4">
                                    <div className="flex items-center gap-3">
                                        <section.icon
                                            size={22}
                                            className="text-accent-positive"
                                            aria-hidden="true"
                                        />
                                        <h3 className="text-xl font-semibold">{section.title}</h3>
                                    </div>
                                    <Link
                                        className="btn-secondary min-h-9 text-xs"
                                        href={section.href}
                                    >
                                        Open
                                    </Link>
                                </div>
                                <p className="mt-4 text-sm leading-6 text-white/70">
                                    {section.body}
                                </p>
                            </article>
                        ))}
                    </div>
                </section>

                <section className="mt-8 rounded-lg border border-white/10 bg-surface-elevated-2 p-5">
                    <div className="flex items-center gap-3">
                        <Shield size={22} className="text-accent-positive" aria-hidden="true" />
                        <h2 className="text-xl font-semibold">Current Limits</h2>
                    </div>
                    <ul className="mt-4 grid gap-2 text-sm leading-6 text-white/70">
                        {limits.map((limit) => (
                            <li key={limit}>{limit}</li>
                        ))}
                    </ul>
                </section>
            </div>
        </main>
    );
}

function ManualMetric({ label, value }: { label: string; value: string }) {
    return (
        <div className="rounded-lg border border-white/10 bg-surface-elevated-2 p-4">
            <p className="text-xs font-semibold uppercase text-white/45">{label}</p>
            <p className="mt-2 text-lg font-semibold">{value}</p>
        </div>
    );
}
