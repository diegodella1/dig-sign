import { revalidatePath } from 'next/cache';

import { AuditTail } from '@/components/broadcast/audit-tail';
import { BroadcastLayout } from '@/components/broadcast/broadcast-layout';
import { LiveAlertsPanel } from '@/components/broadcast/live-alerts-panel';
import { LiveOnAirPanel } from '@/components/broadcast/live-on-air-panel';
import { OperatePreShowBanner } from '@/components/broadcast/operate-pre-show-banner';
import { QuickActionsBar } from '@/components/broadcast/quick-actions-bar';
import { RunbookProgress } from '@/components/broadcast/runbook-progress';
import type { OutputMonitorPayload } from '@/components/broadcast/types';
import { UpNextQueue } from '@/components/broadcast/up-next-queue';
import { AdminShell } from '@/components/admin/admin-shell';
import { OutputMonitorPanel } from '@/components/output/output-monitor-panel';
import { Notice } from '@/components/ui';
import { recordAuditEvent } from '@/lib/audit/audit';
import { liveOutputHref } from '@/lib/auth/output-auth';
import { getAuditEvents, getLiveSchedule, getRunbookState } from '@/lib/data';
import {
    forceEmergencyLoopOutput,
    forceNextBlockOutput,
    skipActiveBlock,
    updateProgramDayStatus,
} from '@/lib/mutations';
import { clearOutputOverride, getActiveOutputOverride } from '@/lib/output-overrides';
import { RUNBOOK_TEMPLATE } from '@/lib/runbook';
import { createDaySchema } from '@/lib/schemas';
import {
    isoDateInTimezone,
    PLAYOUT_TIMEZONE,
    secondsSinceMidnightInTimezone,
} from '@/lib/helpers/time';
import { findActiveSchedule } from '@/lib/scheduling/scheduler';

export const dynamic = 'force-dynamic';

export default async function OperatePage() {
    const schedule = await getLiveSchedule();
    const timezone = schedule.day?.timezone ?? PLAYOUT_TIMEZONE;
    const today = schedule.day?.airDate ?? isoDateInTimezone(new Date(), timezone);
    const nowSeconds = secondsSinceMidnightInTimezone(new Date(), timezone);

    const [outputOverride, auditEvents, runbookState] = await Promise.all([
        getActiveOutputOverride(schedule.day?.id),
        getAuditEvents({ limit: 5 }),
        schedule.day ? getRunbookState(schedule.day.id) : Promise.resolve([]),
    ]);

    const active = findActiveSchedule(schedule, nowSeconds);
    const dayStatus = schedule.day?.status ?? 'draft';
    const isLive = dayStatus === 'active' && active.block !== null;
    const dayId = schedule.day?.id ?? null;

    const upNext = schedule.blocks
        .filter(
            (block) =>
                (block.status === 'ready' || block.status === 'active') &&
                block.startTimeSeconds > nowSeconds,
        )
        .sort((a, b) => a.startTimeSeconds - b.startTimeSeconds)
        .slice(0, 5)
        .map((block) => ({
            id: block.id,
            title: block.title,
            startTimeSeconds: block.startTimeSeconds,
            durationSeconds: block.durationSeconds,
            status: block.status,
        }));

    const nextBlock = upNext[0] ?? null;

    const activeSourceLabel = active.block
        ? (active.asset?.sourceType ?? active.slide?.slideType ?? 'scheduled')
        : '—';

    const initialMonitor: OutputMonitorPayload = {
        generatedAt: new Date().toISOString(),
        timezone,
        serverSeconds: nowSeconds,
        day: schedule.day
            ? { airDate: schedule.day.airDate, status: schedule.day.status }
            : null,
        block: active.block
            ? {
                  title: active.block.title,
                  status: active.block.status,
                  elapsedInBlock: active.elapsedInBlock,
                  durationSeconds: active.block.durationSeconds,
              }
            : null,
        asset: active.asset
            ? {
                  id: active.asset.id,
                  title: active.asset.title,
                  sourceType: active.asset.sourceType,
                  status: active.asset.status,
                  lifecycleState: active.asset.lifecycleState ?? 'reviewed',
                  playbackReadinessStatus: active.asset.playbackReadinessStatus ?? 'unchecked',
                  playbackError: active.asset.playbackError ?? null,
              }
            : null,
        fallback: active.fallbackAsset ? { title: active.fallbackAsset.title } : null,
        fallbackReason: active.reason ?? null,
        override: outputOverride
            ? {
                  id: outputOverride.id,
                  sourceType: outputOverride.sourceType,
                  label: outputOverride.label ?? null,
                  streamProtocol: outputOverride.streamProtocol ?? null,
                  expiresAt: outputOverride.expiresAt ?? null,
              }
            : null,
        mediaError:
            active.asset?.sourceType === 'vimeo' &&
            active.asset.playbackReadinessStatus === 'failed'
                ? (active.asset.playbackError ?? 'Vimeo playback failed')
                : null,
    };

    const runbookByKey = new Map(runbookState.map((item) => [`${item.section}:${item.itemKey}`, item]));
    const checkedCount = RUNBOOK_TEMPLATE.reduce(
        (total, section) =>
            total +
            section.items.filter((item) => runbookByKey.get(`${section.section}:${item.key}`)?.checked)
                .length,
        0,
    );
    const totalCount = RUNBOOK_TEMPLATE.reduce((total, section) => total + section.items.length, 0);
    const criticalOpen = RUNBOOK_TEMPLATE.flatMap((section) =>
        section.items
            .filter((item) => item.critical && !runbookByKey.get(`${section.section}:${item.key}`)?.checked)
            .map((item) => item.label),
    );

    async function stopBroadcast() {
        'use server';
        await mutateDayStatus(await resolveToday(), 'ready', true);
    }

    async function pauseAutomation() {
        'use server';
        const context = await resolveOperateContext();

        if (!context.dayId) {
            throw new Error('No program day');
        }

        const clearResult = await clearOutputOverride(context.dayId);

        if (!clearResult.success) {
            throw new Error(clearResult.error);
        }

        revalidatePath('/admin/operate');
        revalidatePath('/admin/output');
    }

    async function resumeAutomation() {
        'use server';
        await mutateDayStatus(await resolveToday(), 'active', true);
    }

    async function skipBlock() {
        'use server';
        const context = await resolveOperateContext();

        if (!context.active.block) {
            throw new Error('No active block');
        }

        const result = await skipActiveBlock({
            date: context.today,
            blockId: context.active.block.id,
            elapsedInBlock: context.active.elapsedInBlock,
        });

        if (!result.success) {
            throw new Error(result.error);
        }
    }

    async function goNextBlock() {
        'use server';
        const context = await resolveOperateContext();
        const next =
            context.schedule.blocks
                .filter(
                    (block) =>
                        (block.status === 'ready' || block.status === 'active') &&
                        block.startTimeSeconds > context.nowSeconds,
                )
                .sort((a, b) => a.startTimeSeconds - b.startTimeSeconds)[0] ?? null;

        if (!context.dayId || !next) {
            throw new Error('No next block');
        }

        const result = await forceNextBlockOutput({
            programDayId: context.dayId,
            date: context.today,
            nextBlockId: next.id,
        });

        if (!result.success) {
            throw new Error(result.error);
        }
    }

    async function emergencyLoop() {
        'use server';
        const context = await resolveOperateContext();

        if (!context.dayId) {
            throw new Error('No program day');
        }

        const result = await forceEmergencyLoopOutput({
            programDayId: context.dayId,
            date: context.today,
        });

        if (!result.success) {
            throw new Error(result.error);
        }
    }

    const replaceAssetHref = active.block
        ? `/admin/schedule/${today}/blocks/${active.block.id}`
        : null;

    return (
        <AdminShell title="Operate">
            {!schedule.day ? (
                <Notice tone="warn" title="No program day">
                    <a href="/admin/program" className="font-semibold underline">
                        Open Program
                    </a>{' '}
                    to create today&apos;s rundown before going live.
                </Notice>
            ) : null}

            <BroadcastLayout
                main={
                    <>
                        {schedule.day ? (
                            <OperatePreShowBanner
                                dayStatus={dayStatus}
                                airDate={today}
                                runbookHref={`/admin/runbook/${today}`}
                            />
                        ) : null}

                        <LiveOnAirPanel
                            initialBlockTitle={active.block?.title ?? null}
                            initialSourceLabel={activeSourceLabel}
                            initialElapsed={active.elapsedInBlock}
                            initialDuration={active.block?.durationSeconds ?? 0}
                            initialDayStatus={dayStatus}
                        />

                        <LiveAlertsPanel initial={initialMonitor} />

                        <UpNextQueue airDate={today} blocks={upNext} />

                        <details className="rounded-md border border-line bg-surface-elevated-2 p-3">
                            <summary className="cursor-pointer text-xs font-bold uppercase tracking-wide text-muted">
                                Output diagnostics
                            </summary>
                            <div className="mt-3">
                                <OutputMonitorPanel initial={initialMonitor} />
                            </div>
                        </details>
                    </>
                }
                rail={
                    <>
                        <QuickActionsBar
                            liveBrowserHref={liveOutputHref(true)}
                            outputControlHref="/admin/output"
                            replaceAssetHref={replaceAssetHref}
                            scheduleHref={`/admin/schedule/${today}`}
                            canStop={isLive || dayStatus === 'active'}
                            canPause={dayStatus === 'active'}
                            canResume={dayStatus === 'ready' && Boolean(schedule.day)}
                            canSkip={Boolean(active.block && dayStatus === 'active')}
                            canGoNext={Boolean(nextBlock && dayId && dayStatus === 'active')}
                            pauseAction={pauseAutomation}
                            stopAction={stopBroadcast}
                            resumeAction={resumeAutomation}
                            skipAction={skipBlock}
                            goNextAction={goNextBlock}
                            emergencyLoopAction={emergencyLoop}
                        />
                        <div className="mt-4 space-y-4">
                            <RunbookProgress
                                date={today}
                                checkedCount={checkedCount}
                                totalCount={totalCount}
                                criticalOpen={criticalOpen}
                            />
                            <AuditTail
                                events={auditEvents.map((event) => ({
                                    id: event.id,
                                    action: event.action,
                                    createdAt: event.createdAt,
                                    actor: event.actor,
                                }))}
                            />
                        </div>
                    </>
                }
            />
        </AdminShell>
    );
}

async function resolveToday() {
    const schedule = await getLiveSchedule();
    const timezone = schedule.day?.timezone ?? PLAYOUT_TIMEZONE;

    return schedule.day?.airDate ?? isoDateInTimezone(new Date(), timezone);
}

async function resolveOperateContext() {
    const schedule = await getLiveSchedule();
    const timezone = schedule.day?.timezone ?? PLAYOUT_TIMEZONE;
    const today = schedule.day?.airDate ?? isoDateInTimezone(new Date(), timezone);
    const nowSeconds = secondsSinceMidnightInTimezone(new Date(), timezone);
    const active = findActiveSchedule(schedule, nowSeconds);

    return {
        schedule,
        today,
        nowSeconds,
        dayId: schedule.day?.id ?? null,
        active,
    };
}

async function mutateDayStatus(date: string, status: string, allowWarnings: boolean) {
    const schedule = await getLiveSchedule();
    const dayId = schedule.day?.id ?? null;
    const parsed = createDaySchema.safeParse({ date });

    if (!parsed.success) {
        return;
    }

    if (status === 'ready' && dayId) {
        const clearResult = await clearOutputOverride(dayId);

        if (!clearResult.success) {
            throw new Error(clearResult.error);
        }
    }

    const updateResult = await updateProgramDayStatus({
        date: parsed.data.date,
        status,
        allowWarnings,
    });

    if (!updateResult.success) {
        throw new Error(updateResult.error);
    }

    if (status === 'ready') {
        await recordAuditEvent({
            action: 'broadcast.stopped',
            entityType: 'program_days',
            entityId: dayId,
            metadata: { date: parsed.data.date },
        });
    }

    revalidatePath('/admin/operate');
    revalidatePath('/admin/output');
}
