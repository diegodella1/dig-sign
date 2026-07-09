import Link from 'next/link';
import { CheckCircle2, ListChecks, MapPin, MonitorPlay, TriangleAlert } from 'lucide-react';

import { AdminShell } from '@/components/admin/admin-shell';
import { ButtonLink, MetricTile, Notice } from '@/components/ui';
import { requireTenantScope } from '@/lib/auth/tenancy';
import { getAssetSummaries } from '@/lib/data';
import { collectOperatorHealth } from '@/lib/health/health-checks';
import { listContentPlaylists } from '@/lib/content-playlists';
import { buildSignageMonitorPayload } from '@/lib/output/screen-monitor';
import { listScreens, screenMapsEmbedSrc, screenMapsHref } from '@/lib/screens';
import { listVendors } from '@/lib/vendors';

import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';

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
    const missingPlaylistScreens = monitor.screens.filter((screen) => !screen.playlistId);
    const fallbackScreens = monitor.screens.filter((screen) => screen.outputKind === 'fallback');

    if (scope.kind === 'vendor') {
        const setupSteps = [
            {
                label: 'Pantallas asignadas',
                done: screens.length > 0,
                detail: screens.length
                    ? `${screens.length} pantalla${screens.length === 1 ? '' : 's'} disponible${screens.length === 1 ? '' : 's'}`
                    : 'No tenes pantallas: pedi al admin que cree una o agregala aca.',
                href: '/admin/screens',
            },
            {
                label: 'Contenido listo',
                done: readyAssets > 0,
                detail: readyAssets
                    ? `${readyAssets} asset${readyAssets === 1 ? '' : 's'} listo${readyAssets === 1 ? '' : 's'}`
                    : 'No hay assets listos: subi un video o agrega una URL.',
                href: '/admin/assets',
            },
            {
                label: 'Playlist enviada',
                done: submittedPlaylists > 0 || readyPlaylists > 0,
                detail: submittedPlaylists
                    ? `${submittedPlaylists} esperando aprobacion`
                    : readyPlaylists
                      ? `${readyPlaylists} aprobada${readyPlaylists === 1 ? '' : 's'}`
                      : 'Playlist no puede enviarse: faltan items o aprobacion.',
                href: '/admin/playlists',
            },
            {
                label: 'En vivo',
                done: screens.length > 0 && issueScreens === 0,
                detail: issueScreens
                    ? `${issueScreens} pantalla${issueScreens === 1 ? '' : 's'} sin salida lista`
                    : 'Todo listo para reproducir.',
                href: '/admin/screens',
            },
        ];

        return (
            <AdminShell
                title="Inicio"
                description="Pantallas, contenido, playlists, aprobacion y salida en vivo."
                actions={<ButtonLink href="/admin/playlists">Armar playlist</ButtonLink>}
            >
                <section className="mb-6 grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
                    <div className="surface-card p-5">
                        <p className="eyebrow text-accent-positive">Proximo paso</p>
                        <h2 className="mt-2 font-display text-3xl font-bold uppercase">
                            Pantallas, Assets, Playlist, Aprobacion, En vivo
                        </h2>
                        <div className="mt-5 grid gap-3">
                            {setupSteps.map((step) => (
                                <ChecklistItem key={step.label} {...step} />
                            ))}
                        </div>
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
                        <MetricTile
                            label="Pantallas"
                            value={String(screens.length)}
                            detail={issueScreens ? `${issueScreens} necesitan accion` : 'Listas'}
                            tone={issueScreens ? 'warn' : 'ok'}
                        />
                        <MetricTile
                            label="Playlists"
                            value={String(playlists.length)}
                            detail={
                                submittedPlaylists
                                    ? `${submittedPlaylists} en aprobacion`
                                    : `${readyPlaylists} aprobadas`
                            }
                            tone={submittedPlaylists ? 'warn' : 'info'}
                        />
                    </div>
                </section>

                <section className="mb-6 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
                    {monitor.screens.slice(0, 4).map((screen) => (
                        <ScreenStatusCard key={screen.slug} screen={screen} />
                    ))}
                    {!monitor.screens.length ? (
                        <div className="md:col-span-2 xl:col-span-4">
                            <EmptyHomeState
                                title="No tenes pantallas"
                                detail="Pedi al admin que te asigne una pantalla o creala desde Pantallas si tu rol lo permite."
                                href="/admin/screens"
                                action="Ver pantallas"
                            />
                        </div>
                    ) : null}
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
                                Agrega una direccion desde Pantallas para ver el mapa del local.
                            </p>
                            <div className="mt-4">
                                <ButtonLink href="/admin/screens" variant="secondary">
                                    Agregar direccion
                                </ButtonLink>
                            </div>
                        </section>
                    )}
                </section>
            </AdminShell>
        );
    }

    return (
        <AdminShell
            title="Inicio"
            description="Cola de aprobaciones, vendors, pantallas y salud del sistema."
            actions={
                <ButtonLink href="/admin/playlists?approval=submitted">Ver aprobaciones</ButtonLink>
            }
        >
            {healthReport.status !== 'ok' ? (
                <Notice
                    tone={healthReport.status === 'fail' ? 'danger' : 'warn'}
                    title="System health"
                >
                    <Link href="/admin/health" className="font-semibold underline">
                        Review health
                    </Link>{' '}
                    antes de aprobar o asignar contenido.
                </Notice>
            ) : null}

            <section className="mb-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <MetricTile
                    label="Pantallas"
                    value={String(screens.length)}
                    detail={issueScreens ? `${issueScreens} con bloqueo` : 'Sin bloqueos'}
                    tone={issueScreens ? 'warn' : 'ok'}
                />
                <MetricTile
                    label="Aprobaciones"
                    value={String(submittedPlaylists)}
                    detail="Playlists de vendors esperando"
                    tone={submittedPlaylists ? 'warn' : 'ok'}
                />
                <MetricTile
                    label="Contenido"
                    value={`${readyAssets}/${assets.length}`}
                    detail={needsFix ? `${needsFix} requieren revision` : 'Biblioteca lista'}
                    tone={needsFix ? 'warn' : 'ok'}
                />
                <MetricTile
                    label="Vendors"
                    value={String(vendors.length)}
                    detail={`${readyPlaylists} playlists aprobadas`}
                    tone="info"
                />
            </section>

            <section className="grid gap-5 lg:grid-cols-[1fr_1fr]">
                <OperationalPanel
                    title="Cola de aprobacion"
                    icon={ListChecks}
                    actionHref="/admin/playlists?approval=submitted"
                    actionLabel="Abrir cola"
                >
                    {submittedPlaylists ? (
                        <div className="grid gap-3">
                            {playlists
                                .filter((playlist) => playlist.approvalState === 'submitted')
                                .slice(0, 5)
                                .map((playlist) => (
                                    <Link
                                        key={playlist.id}
                                        href={`/admin/playlists/${playlist.id}`}
                                        className="block border-2 border-line bg-surface px-3 py-2 hover:bg-surface-selected-positive"
                                    >
                                        <p className="font-semibold">{playlist.name}</p>
                                        <p className="text-sm text-muted">
                                            {playlist.itemCount} items ·{' '}
                                            {playlist.orientation === 'vertical'
                                                ? 'Vertical 9:16'
                                                : 'Horizontal 16:9'}
                                        </p>
                                    </Link>
                                ))}
                        </div>
                    ) : (
                        <EmptyHomeState
                            title="No hay aprobaciones pendientes"
                            detail="Cuando un vendor envie una playlist, aparece aca."
                            href="/admin/playlists"
                            action="Ver playlists"
                        />
                    )}
                </OperationalPanel>

                <OperationalPanel
                    title="Pantallas con problemas"
                    icon={TriangleAlert}
                    actionHref="/admin/screens"
                    actionLabel="Ver pantallas"
                >
                    {missingPlaylistScreens.length || fallbackScreens.length ? (
                        <div className="grid gap-3">
                            {[...missingPlaylistScreens, ...fallbackScreens]
                                .filter(
                                    (screen, index, list) =>
                                        list.findIndex((item) => item.slug === screen.slug) ===
                                        index,
                                )
                                .slice(0, 5)
                                .map((screen) => (
                                    <ScreenStatusCard key={screen.slug} screen={screen} compact />
                                ))}
                        </div>
                    ) : (
                        <EmptyHomeState
                            title="Todas las pantallas tienen salida"
                            detail="No hay pantallas sin playlist ni fallback activo."
                            href="/admin/operate"
                            action="Abrir monitor"
                        />
                    )}
                </OperationalPanel>
            </section>
        </AdminShell>
    );
}

function ChecklistItem({
    label,
    done,
    detail,
    href,
}: {
    label: string;
    done: boolean;
    detail: string;
    href: string;
}) {
    return (
        <Link
            href={href}
            className="flex items-start gap-3 border-2 border-line bg-surface px-3 py-3 hover:bg-panel-soft"
        >
            {done ? (
                <CheckCircle2 className="mt-0.5 text-success" size={20} aria-hidden="true" />
            ) : (
                <TriangleAlert className="mt-0.5 text-warn" size={20} aria-hidden="true" />
            )}
            <span className="min-w-0">
                <span className="block font-headline text-sm font-bold uppercase">{label}</span>
                <span className="mt-1 block text-sm text-muted">{detail}</span>
            </span>
        </Link>
    );
}

function ScreenStatusCard({
    screen,
    compact = false,
}: {
    screen: {
        slug: string;
        name: string;
        orientation: 'horizontal' | 'vertical';
        playlistId: string | null;
        playlistName: string | null;
        outputKind: string;
        title: string;
    };
    compact?: boolean;
}) {
    const blocked = !screen.playlistId || screen.outputKind === 'fallback';

    return (
        <Link
            href={`/admin/screens/${screen.slug}`}
            className={`surface-card block p-4 hover:bg-panel-soft ${blocked ? 'border-warn-line' : 'border-success-line'}`}
        >
            <div className="flex items-start justify-between gap-3">
                <MonitorPlay size={compact ? 20 : 26} aria-hidden="true" />
                <span
                    className={`border-2 px-2 py-1 font-headline text-[10px] font-bold uppercase ${
                        blocked
                            ? 'border-warn-line bg-warn-soft text-warn-strong'
                            : 'border-success-line bg-success-soft text-success-strong'
                    }`}
                >
                    {blocked ? 'accion' : 'live'}
                </span>
            </div>
            <h3 className="mt-4 font-display text-lg font-bold uppercase">{screen.name}</h3>
            <p className="mt-1 text-sm text-muted">
                {screen.orientation === 'vertical' ? 'Vertical 9:16' : 'Horizontal 16:9'}
            </p>
            <p className="mt-2 text-sm font-semibold">
                {screen.playlistName ?? 'Sin playlist asignada'}
            </p>
            {!compact ? <p className="mt-1 text-xs text-muted">{screen.title}</p> : null}
        </Link>
    );
}

function EmptyHomeState({
    title,
    detail,
    href,
    action,
}: {
    title: string;
    detail: string;
    href: string;
    action: string;
}) {
    return (
        <div className="border-2 border-dashed border-line bg-panel-soft p-4">
            <p className="font-semibold">{title}</p>
            <p className="mt-1 text-sm text-muted">{detail}</p>
            <div className="mt-3">
                <ButtonLink href={href} variant="secondary">
                    {action}
                </ButtonLink>
            </div>
        </div>
    );
}

function OperationalPanel({
    title,
    icon: Icon,
    actionHref,
    actionLabel,
    children,
}: {
    title: string;
    icon: LucideIcon;
    actionHref: string;
    actionLabel: string;
    children: ReactNode;
}) {
    return (
        <section className="surface-card p-5">
            <div className="mb-4 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                    <Icon size={24} aria-hidden="true" />
                    <h2 className="font-display text-xl font-bold uppercase">{title}</h2>
                </div>
                <ButtonLink href={actionHref} variant="secondary">
                    {actionLabel}
                </ButtonLink>
            </div>
            {children}
        </section>
    );
}
