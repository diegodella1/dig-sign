import { Tv } from 'lucide-react';
import { headers } from 'next/headers';
import Link from 'next/link';
import { redirect } from 'next/navigation';

import { AdminNav } from '@/components/admin/admin-nav';
import { OnAirPill } from '@/components/broadcast/on-air-pill';
import { PlayoutClock } from '@/components/broadcast/playout-clock';
import { ModeSubNav } from '@/components/broadcast/mode-sub-nav';
import type { ModeSubNavItem } from '@/components/broadcast/mode-sub-nav-items';
import { getBroadcastStatus } from '@/lib/admin/broadcast-status';
import { requireAdmin, revokeCurrentOperatorSession, safeAdminReturnTo } from '@/lib/auth/auth';
import { formatPlayoutTimeLabel, secondsSinceMidnightInTimezone, PLAYOUT_TIMEZONE } from '@/lib/helpers/time';

import type { ReactNode } from 'react';

export async function AdminShell({
    title,
    description,
    actions,
    subNav,
    children,
}: {
    title: string;
    description?: string;
    actions?: ReactNode;
    subNav?: ModeSubNavItem[];
    children: ReactNode;
}) {
    const requestHeaders = await headers();
    const returnTo = safeAdminReturnTo(requestHeaders.get('x-rtv-current-path'));
    const showBroadcastStatus =
        returnTo.startsWith('/admin') &&
        returnTo !== '/admin/login' &&
        !returnTo.startsWith('/admin/operate') &&
        !returnTo.startsWith('/admin/schedule/');
    const session = await requireAdmin().catch((error) => {
        if (error instanceof Error && error.message === 'Unauthorized') {
            redirect(`/admin/login?return_to=${encodeURIComponent(returnTo)}`);
        }
        throw error;
    });
    const status = await getBroadcastStatus();
    const timezone = PLAYOUT_TIMEZONE;
    const nowSeconds = secondsSinceMidnightInTimezone(new Date(), timezone);
    const isLive = status.dayStatus === 'active' && Boolean(status.activeTitle);

    async function logout() {
        'use server';
        await revokeCurrentOperatorSession();
        redirect('/admin/login?logged_out=1');
    }

    return (
        <div className="min-h-screen bg-surface-elevated-1 text-ink">
            <aside className="fixed inset-y-0 left-0 z-40 hidden w-14 border-r border-line bg-surface md:flex md:flex-col md:items-center md:py-4">
                <Link
                    href="/admin/program"
                    className="grid h-10 w-10 place-items-center rounded-md bg-ink text-surface hover:opacity-90"
                    aria-label="Roxom TV program hub"
                    title="Program"
                >
                    <Tv size={18} aria-hidden="true" />
                </Link>
                <AdminNav />
                <div className="mt-auto flex flex-col items-center gap-2 pb-2">
                    <form action={logout}>
                        <button
                            type="submit"
                            className="grid h-10 w-10 place-items-center rounded-md text-[10px] font-bold uppercase text-muted hover:bg-panel-soft hover:text-ink"
                            aria-label="Logout"
                            title="Logout"
                        >
                            Out
                        </button>
                    </form>
                </div>
            </aside>

            <main className="min-w-0 md:pl-14">
                <header className="sticky top-0 z-30 border-b border-line bg-surface-elevated-2/95 backdrop-blur">
                    <div className="flex h-12 items-center gap-3 px-4 md:px-6">
                        <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                                <h1 className="truncate text-base font-semibold md:text-lg">{title}</h1>
                                <OnAirPill isLive={isLive} dayStatus={status.dayStatus} />
                            </div>
                        </div>
                        <PlayoutClock key={nowSeconds} timezone={timezone} initialSeconds={nowSeconds} />
                        {actions ? (
                            <div className="hidden flex-wrap items-center gap-2 sm:flex">{actions}</div>
                        ) : null}
                    </div>
                    {description ? (
                        <p className="hidden truncate px-4 pb-2 text-xs text-muted md:px-6 lg:block">
                            {description}
                        </p>
                    ) : null}
                    {subNav?.length ? (
                        <div className="px-4 md:px-6">
                            <ModeSubNav items={subNav} />
                        </div>
                    ) : null}
                    <AdminNav mobile />
                </header>

                {showBroadcastStatus ? <BroadcastStatusStrip status={status} /> : null}
                <div className="min-w-0 p-4 md:p-6 xl:p-7">{children}</div>
            </main>

            <aside className="sr-only" aria-hidden="true">
                {session.displayName} · {session.handle}
            </aside>
        </div>
    );
}

function BroadcastStatusStrip({
    status,
}: {
    status: Awaited<ReturnType<typeof getBroadcastStatus>>;
}) {
    const healthTone =
        status.health === 'ok'
            ? 'text-success'
            : status.health === 'fail'
              ? 'text-danger'
              : 'text-warn';

    return (
        <section className="border-b border-line bg-panel-soft px-4 py-2 md:px-6">
            <div className="flex min-h-7 flex-wrap items-center gap-x-5 gap-y-1 text-xs">
                <StatusItem
                    label="Now"
                    value={
                        status.ok
                            ? (status.activeTitle ?? 'Nothing scheduled')
                            : 'Status unavailable'
                    }
                    tone={status.activeTitle ? 'ok' : 'warn'}
                />
                <StatusItem
                    label="Next"
                    value={
                        status.nextTitle && status.nextSeconds !== null
                            ? `${formatPlayoutTimeLabel(status.nextSeconds)} · ${status.nextTitle}`
                            : 'No next block'
                    }
                    tone={status.nextTitle ? 'neutral' : 'warn'}
                />
                <StatusItem
                    label="Fallback"
                    value={status.fallbackTitle ?? 'Missing'}
                    tone={status.fallbackTitle ? 'ok' : 'warn'}
                />
                <div className="ml-auto flex items-center gap-3 font-bold uppercase tracking-wide text-muted">
                    <span className={healthTone}>Health {status.health}</span>
                    <span>Day {status.dayStatus}</span>
                </div>
            </div>
        </section>
    );
}

function StatusItem({
    label,
    value,
    tone,
}: {
    label: string;
    value: string;
    tone: 'neutral' | 'ok' | 'warn';
}) {
    const toneClass = tone === 'ok' ? 'text-success' : tone === 'warn' ? 'text-warn' : 'text-ink';

    return (
        <div className="flex min-w-0 items-center gap-1.5">
            <p className="font-bold uppercase text-muted">{label}</p>
            <p className={`max-w-[20rem] truncate font-semibold ${toneClass}`}>{value}</p>
        </div>
    );
}
