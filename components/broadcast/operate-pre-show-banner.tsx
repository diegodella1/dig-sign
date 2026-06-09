'use client';

import Link from 'next/link';

import { ButtonLink } from '@/components/ui';

export function OperatePreShowBanner({
    dayStatus,
    runbookHref,
}: {
    dayStatus: string;
    airDate: string;
    runbookHref: string;
}) {
    if (dayStatus === 'active') {
        return null;
    }

    return (
        <section className="rounded-md border border-warn-line bg-warn-soft px-4 py-2.5 text-sm text-warn-strong">
            <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="font-semibold">
                    {dayStatus === 'ready' ? 'Ready to activate' : 'Day still in draft'}
                </p>
                <div className="flex flex-wrap gap-2">
                    <ButtonLink href="/admin/program" variant="secondary">
                        Activate
                    </ButtonLink>
                    <Link href={runbookHref} className="btn-secondary">
                        Runbook
                    </Link>
                </div>
            </div>
        </section>
    );
}
