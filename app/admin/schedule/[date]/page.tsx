import { programSubNavForDate } from '@/components/broadcast/mode-sub-nav-items';
import { AdminShell } from '@/components/admin/admin-shell';
import { ScheduleWorkspace } from '@/components/schedule-workspace';
import { ButtonLink, Field, FormHeader, Notice } from '@/components/ui';
import { getScheduleForDate } from '@/lib/data';
import { loadFallbackPolicyStatus } from '@/lib/fallback-policy';
import { DAY_TEMPLATES } from '@/lib/scheduling/day-templates';
import { analyzeSchedule, withScheduleIssueLinks } from '@/lib/scheduling/schedule-health';
import {
    PLAYOUT_TIMEZONE,
} from '@/lib/helpers/time';

import {
    addScheduleBlock,
    archiveScheduleRundownBlock,
    bulkCreateCardLoopForDate,
    createEmptyScheduleDay,
    duplicateScheduleRundownBlock,
    reorderScheduleRundown,
    resizeScheduleRundownBlock,
    setupScheduleDayFromTemplate,
    updateScheduleBlockInline,
} from '../actions';

export default async function ScheduleDatePage({
    params,
    searchParams,
}: {
    params: Promise<{ date: string }>;
    searchParams: Promise<{
        uploaded?: string;
        asset?: string;
        slide?: string;
        q?: string;
        kind?: string;
        source?: string;
        show_name?: string;
        error?: string;
        month?: string;
        year?: string;
        created?: string;
        fallback_carousel?: string;
    }>;
}) {
    const { date } = await params;
    const query = await searchParams;
    const schedule = await getScheduleForDate(date);
    const blocks = schedule.blocks.sort((a, b) => a.startTimeSeconds - b.startTimeSeconds);

    async function addBlock(formData: FormData) {
        'use server';

        return addScheduleBlock(date, formData);
    }

    async function updateBlockInline(formData: FormData) {
        'use server';

        return updateScheduleBlockInline(date, formData);
    }

    async function bulkCreateCardLoop(formData: FormData) {
        'use server';

        return bulkCreateCardLoopForDate(date, formData);
    }

    async function reorderRundown(input: { orderedBlockIds: string[] }) {
        'use server';

        return reorderScheduleRundown(date, input);
    }

    async function resizeRundownBlock(input: { blockId: string; durationSeconds: number }) {
        'use server';

        return resizeScheduleRundownBlock(date, input);
    }

    async function duplicateRundownBlock(input: { blockId: string }) {
        'use server';

        return duplicateScheduleRundownBlock(date, input);
    }

    async function archiveRundownBlock(input: { blockId: string }) {
        'use server';

        return archiveScheduleRundownBlock(date, input);
    }

    async function createEmptyDay() {
        'use server';

        return createEmptyScheduleDay(date);
    }

    async function setupDayFromTemplate(formData: FormData) {
        'use server';

        return setupScheduleDayFromTemplate(date, formData);
    }

    const totalScheduledSeconds = blocks.reduce((total, block) => total + block.durationSeconds, 0);
    const fallbackPolicy = await loadFallbackPolicyStatus(schedule);
    const health = analyzeSchedule(schedule, blocks, {
        fallbackPolicyReady: fallbackPolicy.ready,
    });
    const readyBlocks = blocks.filter(
        (block) => block.status === 'ready' || block.status === 'active',
    ).length;

    if (!schedule.day) {
        return (
            <AdminShell
                title={`Set up ${date}`}
                description="Create this day before adding blocks."
                actions={
                    <>
                        <ButtonLink href="/admin/calendar" variant="secondary">
                            Calendar
                        </ButtonLink>
                        <ButtonLink href="/admin/assets" variant="secondary">
                            Media
                        </ButtonLink>
                    </>
                }
            >
                <section className="surface-panel p-4">
                    <FormHeader
                        title="Create schedule day"
                        detail="Use a template for draft slots, or start empty and add blocks manually."
                    />
                    <form
                        action={setupDayFromTemplate}
                        className="mt-4 grid gap-3 lg:grid-cols-[160px_minmax(0,1fr)_150px]"
                    >
                        <Field label="Clock start (24 h)">
                            <input
                                name="start_time"
                                defaultValue="00:00:00"
                                required
                                placeholder="13:30:00"
                                className="border border-line px-3 py-2 text-sm font-normal text-ink"
                            />
                        </Field>
                        <Field label="Template">
                            <select
                                name="template_id"
                                defaultValue={DAY_TEMPLATES[0]?.id}
                                className="border border-line px-3 py-2 text-sm font-normal text-ink"
                            >
                                {DAY_TEMPLATES.map((template) => (
                                    <option key={template.id} value={template.id}>
                                        {template.name} - {template.description}
                                    </option>
                                ))}
                            </select>
                        </Field>
                        <button className="btn-primary self-end">Create from template</button>
                    </form>
                    <form action={createEmptyDay} className="mt-3">
                        <button className="btn-secondary">Create empty day</button>
                    </form>
                </section>
            </AdminShell>
        );
    }

    return (
        <AdminShell title={`Schedule · ${date}`} subNav={programSubNavForDate(date)}>
            {query.uploaded ? <Notice tone="ok">Media uploaded and scheduled.</Notice> : null}

            <ScheduleWorkspace
                date={date}
                schedule={schedule}
                blocks={blocks}
                dayMeta={{
                    timezone: schedule.day.timezone ?? PLAYOUT_TIMEZONE,
                    dayStatus: schedule.day.status,
                    readyBlocks,
                    totalBlocks: blocks.length,
                    totalScheduledSeconds,
                    healthCriticalCount: health.criticalCount,
                    healthWarnCount: health.warnCount,
                }}
                healthInitial={{
                    generatedAt: new Date().toISOString(),
                    criticalCount: health.criticalCount,
                    warnCount: health.warnCount,
                    issues: health.issues.map((issue) => withScheduleIssueLinks(date, issue)),
                }}
                createAction={addBlock}
                updateAction={updateBlockInline}
                reorderAction={reorderRundown}
                resizeAction={resizeRundownBlock}
                duplicateAction={duplicateRundownBlock}
                archiveAction={archiveRundownBlock}
                bulkCreateAction={bulkCreateCardLoop}
                initialContentValue={initialContentValue(query)}
                initialFilters={initialContentFilters(query)}
                createdBlockId={query.created}
                initialMessage={query.error}
                fallbackPolicyReady={fallbackPolicy.ready}
                fallbackPolicyLabel={fallbackPolicy.label}
            />
        </AdminShell>
    );
}

function initialContentValue(query: { asset?: string; slide?: string }) {
    if (query.asset) {
        return `asset:${query.asset}`;
    }

    if (query.slide) {
        return `slide:${query.slide}`;
    }

    return undefined;
}

function initialContentFilters(query: {
    q?: string;
    kind?: string;
    source?: string;
    show_name?: string;
    month?: string;
    year?: string;
}) {
    return {
        query: query.q,
        kind: normalizeScheduleKind(query.kind),
        source: query.source,
        showName: query.show_name,
        month: query.month,
        year: query.year,
    };
}

function normalizeScheduleKind(kind?: string) {
    if (kind === 'videos') {
        return 'video';
    }

    if (kind === 'graphics' || kind === 'images') {
        return 'image';
    }

    if (kind === 'slides') {
        return 'slide';
    }

    if (kind === 'all') {
        return undefined;
    }

    return kind;
}
