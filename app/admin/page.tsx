import Link from 'next/link';
import {
    ListChecks,
    MapPin,
    MonitorPlay,
    Music,
    PackageOpen,
    RadioTower,
    Settings,
} from 'lucide-react';

import { AdminShell } from '@/components/admin/admin-shell';
import { ButtonLink, MetricTile, Notice } from '@/components/ui';
import { requireTenantScope } from '@/lib/auth/tenancy';
import { getAssetSummaries } from '@/lib/data';
import { collectOperatorHealth } from '@/lib/health/health-checks';
import { listContentPlaylists } from '@/lib/content-playlists';
import { buildSignageMonitorPayload } from '@/lib/output/screen-monitor';
import { listScreens, screenMapsEmbedSrc, screenMapsHref } from '@/lib/screens';
import { listVendors } from '@/lib/vendors';

export const dynamic = 'force-dynamic';

export default async function AdminDashboardPage() {
    const scope = await requireTenantScope();
    const [assets, healthReport, screens, playlists, monitor] = await Promise.all([
        getAssetSummaries(),
        collectOperatorHealth(),
        listScreens(),
        listContentPlaylists(),
        buildSignageMonitorPayload(),
    ]);
    const vendors = scope.kind === 'global' ? await listVendors() : [];
    const readyAssets = assets.filter((asset) => asset.status === 'ready').length;
    const needsFix = assets.length - readyAssets;
    const readyPlaylists = playlists.filter(
        (playlist) => playlist.status === 'ready' && playlist.approvalState === 'approved',
    ).length;
    const submittedPlaylists = playlists.filter(
        (playlist) => playlist.approvalState === 'submitted',
    ).length;
    const issueScreens = monitor.screens.filter(
        (screen) => !screen.playlistId || screen.outputKind === 'fallback',
    ).length;
    const locatedScreens = screens.filter((screen) => screenMapsEmbedSrc(screen));

    if (scope.kind === 'vendor') {
        return (
            <AdminShell
                title="Vendor Workspace"
                description="Your isolated media, playlists, music, and screens."
                actions={<ButtonLink href="/admin/playlists">Build playlist</ButtonLink>}
            >
                <section className="mb-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                    <MetricTile
                        label="My Screens"
                        value={String(screens.length)}
                        detail={issueScreens ? `${issueScreens} need attention` : 'All clear'}
                        tone={issueScreens ? 'warn' : 'ok'}
                    />
                    <MetricTile
                        label="My Playlists"
                        value={String(playlists.length)}
                        detail={
                            submittedPlaylists
                                ? `${submittedPlaylists} awaiting approval`
                                : `${readyPlaylists} approved`
                        }
                        tone={submittedPlaylists ? 'warn' : 'info'}
                    />
                    <MetricTile
                        label="My Media"
                        value={`${readyAssets}/${assets.length}`}
                        detail={needsFix ? `${needsFix} need review` : 'Library ready'}
                        tone={needsFix ? 'warn' : 'ok'}
                    />
                    <MetricTile
                        label="Live Status"
                        value={issueScreens ? 'CHECK' : 'OK'}
                        detail="Current player output"
                        tone={issueScreens ? 'warn' : 'ok'}
                    />
                </section>

                <section className="mb-8">
                    <div className="mb-3 flex items-center gap-3">
                        <MapPin size={24} aria-hidden="true" />
                        <div>
                            <h2 className="font-display text-2xl font-bold uppercase">
                                Screen Locations
                            </h2>
                            <p className="mt-1 text-sm font-medium text-muted">
                                Physical addresses for your screens.
                            </p>
                        </div>
                    </div>
                    {locatedScreens.length ? (
                        <div className="grid gap-5 lg:grid-cols-2">
                            {locatedScreens.map((screen) => {
                                const mapsHref = screenMapsHref(screen);
                                const mapsEmbedSrc = screenMapsEmbedSrc(screen);

                                return (
                                    <article
                                        key={screen.id}
                                        className="surface-card overflow-hidden"
                                    >
                                        <div className="flex flex-wrap items-center justify-between gap-3 border-b-2 border-line p-4">
                                            <div>
                                                <h3 className="font-display text-lg font-bold uppercase">
                                                    {screen.name}
                                                </h3>
                                                <p className="mt-1 text-sm font-medium text-muted">
                                                    {screen.locationName ?? 'Location'}
                                                    {screen.address ? ` · ${screen.address}` : ''}
                                                </p>
                                            </div>
                                            {mapsHref ? (
                                                <a
                                                    href={mapsHref}
                                                    className="rounded-md border border-line px-3 py-1.5 text-sm"
                                                    target="_blank"
                                                    rel="noreferrer"
                                                >
                                                    Google Maps
                                                </a>
                                            ) : null}
                                        </div>
                                        {mapsEmbedSrc ? (
                                            <iframe
                                                title={`${screen.name} map`}
                                                src={mapsEmbedSrc}
                                                className="h-64 w-full border-0"
                                                loading="lazy"
                                                referrerPolicy="no-referrer-when-downgrade"
                                            />
                                        ) : null}
                                    </article>
                                );
                            })}
                        </div>
                    ) : (
                        <section className="surface-card p-5">
                            <p className="font-semibold">No screen addresses yet.</p>
                            <p className="mt-1 text-sm font-medium text-muted">
                                Add an address from Screens to show each display on Google Maps.
                            </p>
                            <div className="mt-4">
                                <ButtonLink href="/admin/screens" variant="secondary">
                                    Add addresses
                                </ButtonLink>
                            </div>
                        </section>
                    )}
                </section>

                <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
                    <ModeCard
                        href="/admin/assets"
                        icon={PackageOpen}
                        title="My Assets"
                        detail="Upload images, videos, and public URLs"
                        tone="prepare"
                    />
                    <ModeCard
                        href="/admin/playlists"
                        icon={ListChecks}
                        title="My Playlists"
                        detail="Build horizontal and vertical loops"
                        tone="program"
                    />
                    <ModeCard
                        href="/admin/music"
                        icon={Music}
                        title="My Music"
                        detail="Upload and choose your own audio"
                        tone="operate"
                    />
                    <ModeCard
                        href="/admin/screens"
                        icon={MonitorPlay}
                        title="My Screens"
                        detail="Assign approved playlists to players"
                        tone="neutral"
                    />
                </section>
            </AdminShell>
        );
    }

    return (
        <AdminShell
            title="Dashboard"
            description="Signage overview. Use Operate to monitor players."
            actions={<ButtonLink href="/admin/operate">Open Operate</ButtonLink>}
        >
            {healthReport.status !== 'ok' ? (
                <Notice
                    tone={healthReport.status === 'fail' ? 'danger' : 'warn'}
                    title="System health"
                >
                    <Link href="/admin/health" className="font-semibold underline">
                        Review health
                    </Link>{' '}
                    before handoff.
                </Notice>
            ) : null}

            <section className="mb-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <MetricTile
                    label="Active Screens"
                    value={String(screens.length)}
                    detail={issueScreens ? `${issueScreens} need attention` : 'All clear'}
                    tone={issueScreens ? 'warn' : 'ok'}
                />
                <MetricTile
                    label="Pending Approval"
                    value={String(submittedPlaylists)}
                    detail="Vendor playlists waiting"
                    tone={submittedPlaylists ? 'warn' : 'ok'}
                />
                <MetricTile
                    label="Media Ready"
                    value={`${readyAssets}/${assets.length}`}
                    detail={needsFix ? `${needsFix} need review` : 'Library ready'}
                    tone={needsFix ? 'warn' : 'ok'}
                />
                <MetricTile
                    label="Vendors"
                    value={String(vendors.length)}
                    detail={`${readyPlaylists} approved playlists`}
                    tone="info"
                />
            </section>

            <section className="mb-3">
                <h2 className="font-display text-2xl font-bold uppercase">Quick Access Modules</h2>
                <p className="mt-1 text-sm font-medium text-muted">
                    Move between live control, content prep, screens, and operator settings.
                </p>
            </section>

            <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
                <ModeCard
                    href="/admin/operate"
                    icon={RadioTower}
                    title="Operate"
                    detail={`${screens.length} screen${screens.length === 1 ? '' : 's'} · ${issueScreens ? `${issueScreens} need attention` : 'all clear'}`}
                    tone="operate"
                />
                <ModeCard
                    href="/admin/playlists"
                    icon={ListChecks}
                    title="Approvals"
                    detail={`${submittedPlaylists} pending · ${readyPlaylists} approved`}
                    tone="program"
                />
                <ModeCard
                    href="/admin/prepare"
                    icon={PackageOpen}
                    title="Prepare"
                    detail={`${readyAssets} ready · ${needsFix} need fix`}
                    tone="prepare"
                />
                <ModeCard
                    href="/admin/settings"
                    icon={Settings}
                    title="Admin"
                    detail="Operators, health, audit, and settings"
                    tone="neutral"
                />
            </section>
        </AdminShell>
    );
}

function ModeCard({
    href,
    icon: Icon,
    title,
    detail,
    tone,
}: {
    href: string;
    icon: typeof RadioTower;
    title: string;
    detail: string;
    tone: 'operate' | 'program' | 'prepare' | 'neutral';
}) {
    const accent =
        tone === 'operate'
            ? 'hover:bg-danger-soft'
            : tone === 'program'
              ? 'hover:bg-info-soft'
              : tone === 'prepare'
                ? 'hover:bg-surface-selected-positive'
                : 'hover:bg-panel-soft';

    return (
        <Link
            href={href}
            className={`surface-card group flex min-h-40 flex-col justify-between p-5 transition hover:-translate-x-1 hover:-translate-y-1 hover:shadow-[6px_6px_0_#1a1a1a] ${accent}`}
        >
            <div className="flex items-center justify-between gap-3 text-ink">
                <Icon size={34} aria-hidden="true" />
                <span className="border-2 border-line bg-surface-selected-positive px-2 py-1 font-headline text-[10px] font-bold uppercase">
                    Open
                </span>
            </div>
            <div>
                <h3 className="font-display text-xl font-bold uppercase">{title}</h3>
                <p className="mt-2 text-sm font-medium text-muted">{detail}</p>
            </div>
        </Link>
    );
}
