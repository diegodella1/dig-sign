import { getTranslations } from 'next-intl/server';

import { adminSubNav } from '@/components/broadcast/mode-sub-nav-items';
import { AdminShell } from '@/components/admin/admin-shell';
import { StopBroadcastButton } from '@/components/output/stop-broadcast-button';
import { ClearStateBadge, Notice } from '@/components/ui';
import { recordAuditEvent } from '@/lib/audit/audit';
import { liveOutputHref } from '@/lib/auth/output-auth';
import { getLiveSchedule } from '@/lib/data';
import { updateProgramDayStatus } from '@/lib/mutations';
import { clearOutputOverride } from '@/lib/output-overrides';
import { findActiveSchedule } from '@/lib/scheduling/scheduler';
import { createDaySchema } from '@/lib/schemas';
import {
    isoDateInTimezone,
    PLAYOUT_TIMEZONE,
    secondsSinceMidnightInTimezone,
} from '@/lib/helpers/time';

export default async function AdminOutputPage() {
    const [t, tOps, liveBundle] = await Promise.all([
        getTranslations(),
        getTranslations('ops'),
        getLiveSchedule(),
    ]);

    const timezone = liveBundle.day?.timezone ?? PLAYOUT_TIMEZONE;
    const nowSeconds = secondsSinceMidnightInTimezone(new Date(), timezone);
    const active = findActiveSchedule(liveBundle, nowSeconds);
    const dayStatus = liveBundle.day?.status ?? 'draft';
    const isLive = dayStatus === 'active' && active.block !== null;
    const dayDate = liveBundle.day
        ? isoDateInTimezone(new Date(), liveBundle.day.timezone ?? PLAYOUT_TIMEZONE)
        : null;
    const outputHref = liveOutputHref(false);
    const debugHref = liveOutputHref(true);

    async function stopBroadcast() {
        'use server';

        const bundle = await getLiveSchedule();
        const date = bundle.day?.airDate;

        if (!date) {
            return;
        }

        const parsed = createDaySchema.safeParse({ date });

        if (!parsed.success) {
            return;
        }

        if (bundle.day?.id) {
            const clearResult = await clearOutputOverride(bundle.day.id);

            if (!clearResult.success) {
                throw new Error(clearResult.error);
            }
        }

        const updateResult = await updateProgramDayStatus({
            date: parsed.data.date,
            status: 'ready',
            allowWarnings: true,
        });

        if (!updateResult.success) {
            throw new Error(updateResult.error);
        }

        await recordAuditEvent({
            action: 'broadcast.stopped',
            entityType: 'program_days',
            entityId: bundle.day?.id ?? null,
            metadata: { date: parsed.data.date },
        });
    }

    return (
        <AdminShell
            title="Capture"
            description="OBS/vMix capture machine — open live output and unlock audio once."
            subNav={adminSubNav}
        >
            <section className="mx-auto max-w-2xl rounded-md border border-line bg-surface-elevated-2 p-6">
                <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                        <ClearStateBadge tone={isLive ? 'ok' : dayStatus === 'active' ? 'warn' : 'info'}>
                            {isLive ? t('chrome.onAir') : dayStatus === 'active' ? 'Active' : t('chrome.offAir')}
                        </ClearStateBadge>
                        <h2 className="mt-3 text-2xl font-semibold">Browser capture</h2>
                        <p className="mt-2 text-sm text-muted">
                            Open the live output window on this machine, click Start Output once, then
                            capture the browser in OBS or vMix.
                        </p>
                    </div>
                </div>

                <div className="mt-6 grid gap-2">
                    <a className="btn-primary min-h-11 text-center" href={outputHref} target="_blank" rel="noreferrer">
                        Open live output
                    </a>
                    <a className="btn-secondary min-h-11 text-center" href={debugHref} target="_blank" rel="noreferrer">
                        Open debug view
                    </a>
                </div>

                <Notice tone="info" title="Audio unlock">
                    Browser policy requires one operator click on Start Output after every load or reload.
                </Notice>

                <div className="mt-4 rounded-md border border-line bg-panel-soft p-4 text-sm">
                    <p className="font-semibold">{active.block?.title ?? t('output.fallback.noActiveBlock')}</p>
                    <p className="mt-1 text-muted">{dayDate ?? 'No day'} · {dayStatus}</p>
                </div>

                <div className="mt-4">
                    <StopBroadcastButton
                        action={stopBroadcast}
                        disabled={!isLive && dayStatus !== 'active'}
                        label={tOps('stopBroadcast')}
                        confirmMessage="Stop the broadcast? This will revert the day status to ready."
                    />
                </div>

                <p className="mt-4 text-center text-xs text-muted">
                    Full monitoring and recovery live in{' '}
                    <a href="/admin/operate" className="font-semibold text-accent-positive hover:underline">
                        Operate
                    </a>
                    .
                </p>
            </section>
        </AdminShell>
    );
}
