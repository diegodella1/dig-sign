import { HelpCircle, LogOut, Settings2, UserCircle } from 'lucide-react';
import { headers } from 'next/headers';
import Link from 'next/link';
import { redirect } from 'next/navigation';

import { AdminNav } from '@/components/admin/admin-nav';
import { ModeSubNav } from '@/components/broadcast/mode-sub-nav';
import type { ModeSubNavItem } from '@/components/broadcast/mode-sub-nav-items';
import { requireAdmin, revokeCurrentOperatorSession, safeAdminReturnTo } from '@/lib/auth/auth';

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
    const session = await requireAdmin().catch((error) => {
        if (error instanceof Error && error.message === 'Unauthorized') {
            redirect(`/admin/login?return_to=${encodeURIComponent(returnTo)}`);
        }
        throw error;
    });

    async function logout() {
        'use server';
        await revokeCurrentOperatorSession();
        redirect('/admin/login?logged_out=1');
    }
    const scopeKind = session.vendorId ? 'vendor' : 'global';

    return (
        <div className="min-h-screen bg-surface-elevated-1 text-ink">
            <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 border-r-2 border-line bg-surface md:flex md:flex-col md:py-8">
                <Link
                    href="/admin"
                    className="mx-6 mb-8 block"
                    aria-label="DigSign dashboard"
                    title="Dashboard"
                >
                    <span className="block font-display text-3xl font-bold leading-none text-ink">
                        DigSign
                    </span>
                    <span className="mt-1 block font-headline text-xs font-bold uppercase tracking-[0.08em] text-muted">
                        Command Center
                    </span>
                </Link>
                <div className="flex flex-1 flex-col px-4">
                    <AdminNav scopeKind={scopeKind} />
                </div>
                <div className="mx-4 mt-auto border-t-2 border-line pt-4">
                    <Link
                        href="/manual"
                        className="mb-2 flex min-h-11 items-center gap-3 border-2 border-transparent px-4 font-headline text-sm font-bold uppercase text-muted hover:border-line hover:bg-panel-soft hover:text-ink hover:shadow-[3px_3px_0_#1a1a1a]"
                    >
                        <HelpCircle size={19} aria-hidden="true" />
                        Support
                    </Link>
                    <form action={logout}>
                        <button
                            type="submit"
                            className="flex min-h-11 w-full items-center gap-3 border-2 border-transparent px-4 font-headline text-sm font-bold uppercase text-muted hover:border-line hover:bg-danger-soft hover:text-danger-strong hover:shadow-[3px_3px_0_#1a1a1a]"
                            aria-label="Logout"
                            title="Logout"
                        >
                            <LogOut size={19} aria-hidden="true" />
                            Logout
                        </button>
                    </form>
                </div>
            </aside>

            <main className="min-w-0 md:pl-64">
                <header className="sticky top-0 z-30 border-b-2 border-line bg-surface">
                    <div className="flex min-h-16 items-center gap-3 px-4 md:px-6">
                        <div className="min-w-0 flex-1">
                            <h1 className="truncate font-display text-xl font-bold uppercase md:text-2xl">
                                {title}
                            </h1>
                        </div>
                        {actions ? (
                            <div className="hidden flex-wrap items-center gap-2 sm:flex">
                                {actions}
                            </div>
                        ) : null}
                        <div className="hidden items-center gap-2 md:flex">
                            <Link
                                href="/admin/settings"
                                className="grid h-10 w-10 place-items-center border-2 border-transparent text-ink hover:border-line hover:bg-panel-soft"
                                aria-label="Settings"
                            >
                                <Settings2 size={19} aria-hidden="true" />
                            </Link>
                            <span
                                className="grid h-10 w-10 place-items-center border-2 border-line bg-panel text-ink"
                                title={`${session.displayName} (${session.handle})`}
                            >
                                <UserCircle size={22} aria-hidden="true" />
                            </span>
                        </div>
                    </div>
                    {description ? (
                        <p className="hidden truncate px-4 pb-3 text-sm font-medium text-muted md:px-6 lg:block">
                            {description}
                        </p>
                    ) : null}
                    {subNav?.length ? (
                        <div className="px-4 md:px-6">
                            <ModeSubNav items={subNav} />
                        </div>
                    ) : null}
                    <AdminNav mobile scopeKind={scopeKind} />
                </header>

                <div className="min-w-0 p-4 md:p-6 xl:p-7">{children}</div>
            </main>

            <aside className="sr-only" aria-hidden="true">
                {session.displayName} · {session.handle}
            </aside>
        </div>
    );
}
