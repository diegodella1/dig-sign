import Link from 'next/link';

import { AuditTail } from '@/components/broadcast/audit-tail';
import { BroadcastLayout } from '@/components/broadcast/broadcast-layout';
import { LiveAlertsPanel } from '@/components/broadcast/live-alerts-panel';
import { AdminShell } from '@/components/admin/admin-shell';
import { OutputMonitorPanel } from '@/components/output/output-monitor-panel';
import { ButtonLink, FormHeader, Notice } from '@/components/ui';
import { requireTenantScope } from '@/lib/auth/tenancy';
import { getAuditEvents } from '@/lib/data';
import { liveOutputHrefForScreen } from '@/lib/auth/output-auth';
import { collectOperatorHealth } from '@/lib/health/health-checks';
import { buildSignageMonitorPayload } from '@/lib/output/screen-monitor';
import { isPlayableContentPlaylist, listContentPlaylists } from '@/lib/content-playlists';
import { listScreens } from '@/lib/screens';
import { listVendors } from '@/lib/vendors';
import { formatTimecode } from '@/lib/helpers/time';

export const dynamic = 'force-dynamic';

export default async function OperatePage() {
    const scope = await requireTenantScope();
    const [monitor, screens, playlists, auditEvents, healthReport] = await Promise.all([
        buildSignageMonitorPayload(),
        listScreens(),
        listContentPlaylists(),
        getAuditEvents({ limit: 5 }),
        collectOperatorHealth(),
    ]);
    const vendors = scope.kind === 'global' ? await listVendors() : [];
    const vendorNameById = new Map(vendors.map((vendor) => [vendor.id, vendor.name]));
    const readyPlaylists = playlists.filter(isPlayableContentPlaylist).length;
    const submittedPlaylists = playlists.filter(
        (playlist) => playlist.approvalState === 'submitted',
    ).length;
    const fallbackScreens = monitor.screens.filter(
        (screen) => screen.outputKind === 'fallback',
    ).length;
    const noPlaylistScreens = monitor.screens.filter((screen) => !screen.playlistId).length;
    const monitorBySlug = new Map(monitor.screens.map((entry) => [entry.slug, entry]));

    return (
        <AdminShell title="Operate">
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
            {submittedPlaylists ? (
                <Notice tone="warn" title="Approval queue">
                    <Link href="/admin/playlists" className="font-semibold underline">
                        {submittedPlaylists} playlist{submittedPlaylists === 1 ? '' : 's'}
                    </Link>{' '}
                    waiting for super admin review.
                </Notice>
            ) : null}
            {fallbackScreens || noPlaylistScreens ? (
                <Notice tone="warn" title="Output attention">
                    {fallbackScreens} fallback output{fallbackScreens === 1 ? '' : 's'} ·{' '}
                    {noPlaylistScreens} screen{noPlaylistScreens === 1 ? '' : 's'} without a
                    playlist.
                </Notice>
            ) : null}

            <BroadcastLayout
                main={
                    <>
                        <LiveAlertsPanel initial={monitor} />

                        <section className="rounded-md border border-line bg-surface-elevated-2 p-4">
                            <FormHeader
                                title="Screens on air"
                                detail="Each player loops its assigned playlist for today."
                            />
                            <ul className="mt-4 divide-y divide-line">
                                {screens.map((screen) => {
                                    const snapshot = monitorBySlug.get(screen.slug);

                                    return (
                                        <li
                                            key={screen.id}
                                            className="flex flex-wrap items-center justify-between gap-3 py-3 first:pt-0 last:pb-0"
                                        >
                                            <div>
                                                <p className="font-semibold">{screen.name}</p>
                                                {scope.kind === 'global' ? (
                                                    <p className="text-xs font-semibold uppercase text-muted">
                                                        {vendorNameById.get(screen.vendorId) ??
                                                            screen.vendorId}
                                                    </p>
                                                ) : null}
                                                <p className="text-sm text-muted">
                                                    {snapshot?.playlistName ?? 'No playlist'} ·{' '}
                                                    {snapshot?.title ?? '—'}
                                                </p>
                                                <p className="text-xs text-muted">
                                                    {screen.orientation === 'vertical'
                                                        ? 'Vertical 9:16'
                                                        : 'Horizontal 16:9'}{' '}
                                                    · {snapshot?.reason ?? 'unknown'}
                                                </p>
                                                {snapshot?.durationSeconds ? (
                                                    <p className="text-xs text-muted">
                                                        {formatTimecode(
                                                            snapshot.elapsedSeconds ?? 0,
                                                        )}{' '}
                                                        / {formatTimecode(snapshot.durationSeconds)}{' '}
                                                        · {snapshot.outputKind}
                                                    </p>
                                                ) : (
                                                    <p className="text-xs text-muted">
                                                        {snapshot?.outputKind ?? 'unknown'}
                                                    </p>
                                                )}
                                            </div>
                                            <div className="flex flex-wrap gap-2">
                                                <Link
                                                    href={`/admin/screens/${screen.slug}`}
                                                    className="rounded-md border border-line px-3 py-1.5 text-sm"
                                                >
                                                    Manage
                                                </Link>
                                                <a
                                                    href={liveOutputHrefForScreen(
                                                        screen.slug,
                                                        true,
                                                    )}
                                                    className="rounded-md border border-line px-3 py-1.5 text-sm"
                                                    target="_blank"
                                                    rel="noreferrer"
                                                >
                                                    Open player
                                                </a>
                                            </div>
                                        </li>
                                    );
                                })}
                            </ul>
                        </section>

                        <details className="rounded-md border border-line bg-surface-elevated-2 p-3">
                            <summary className="cursor-pointer text-xs font-bold uppercase tracking-wide text-muted">
                                Output diagnostics
                            </summary>
                            <div className="mt-3">
                                <OutputMonitorPanel initial={monitor} />
                            </div>
                        </details>
                    </>
                }
                rail={
                    <>
                        <section className="rounded-md border border-line bg-surface-elevated-2 p-4">
                            <FormHeader
                                title="Quick links"
                                detail="Signage setup and monitoring."
                            />
                            <div className="mt-3 grid gap-2">
                                <ButtonLink href="/admin/screens" variant="secondary">
                                    Manage screens
                                </ButtonLink>
                                <ButtonLink href="/admin/playlists" variant="secondary">
                                    Approve playlists
                                </ButtonLink>
                                <ButtonLink href="/admin/screens" variant="secondary">
                                    Capture setup
                                </ButtonLink>
                            </div>
                            <p className="mt-3 text-xs text-muted">
                                {readyPlaylists} approved playlist
                                {readyPlaylists === 1 ? '' : 's'} · {submittedPlaylists} pending ·{' '}
                                {screens.length} screen{screens.length === 1 ? '' : 's'}
                            </p>
                        </section>

                        <AuditTail
                            events={auditEvents.map((event) => ({
                                id: event.id,
                                action: event.action,
                                createdAt: event.createdAt,
                                actor: event.actor,
                            }))}
                        />
                    </>
                }
            />
        </AdminShell>
    );
}
