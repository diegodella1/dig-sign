'use client';

import {
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    type DragEndEvent,
} from '@dnd-kit/core';
import { arrayMove, sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { Plus, Repeat } from 'lucide-react';
import type { ReactNode } from 'react';
import { useCallback, useEffect, useMemo, useState, useTransition } from 'react';

import { analyzeSchedule } from '@/lib/scheduling/schedule-health';
import { formatTimecode } from '@/lib/helpers/time';
import type { ProgramBlock, ScheduleBundle } from '@/lib/types';
import type { ScheduleIssue } from '@/lib/scheduling/schedule-health';

import { CalendarScheduleView } from './schedule/schedule-calendar';
import { BlockDrawer } from './schedule/schedule-drawer';
import { ScheduleDayToolbar } from './schedule/schedule-day-toolbar';
import { ScheduleHealthPoller } from './schedule/schedule-health-poller';
import {
    buildContentOptions,
    type DrawerMode,
    type InitialContentFilters,
} from './schedule/helpers';
import { LoopBuilderModal } from './schedule/schedule-loop-builder-modal';

type ScheduleDayMeta = {
    timezone: string;
    dayStatus: string;
    readyBlocks: number;
    totalBlocks: number;
    totalScheduledSeconds: number;
    healthCriticalCount: number;
    healthWarnCount: number;
};

type ScheduleHealthInitial = {
    generatedAt: string;
    criticalCount: number;
    warnCount: number;
    issues: ScheduleIssue[];
};

type ScheduleWorkspaceProps = {
    date: string;
    schedule: ScheduleBundle;
    blocks: ProgramBlock[];
    dayMeta: ScheduleDayMeta;
    healthInitial: ScheduleHealthInitial;
    createAction: (formData: FormData) => Promise<void>;
    updateAction: (formData: FormData) => Promise<void>;
    reorderAction: (input: { orderedBlockIds: string[] }) => Promise<void>;
    resizeAction: (input: { blockId: string; durationSeconds: number }) => Promise<void>;
    duplicateAction: (input: { blockId: string }) => Promise<void>;
    archiveAction: (input: { blockId: string }) => Promise<void>;
    bulkCreateAction: (formData: FormData) => Promise<void>;
    initialContentValue?: string | undefined;
    initialFilters?: InitialContentFilters | undefined;
    createdBlockId?: string | undefined;
    initialMessage?: string | undefined;
    fallbackPolicyReady?: boolean;
    fallbackPolicyLabel?: string;
};

export function ScheduleWorkspace({
    date,
    schedule,
    blocks,
    dayMeta,
    healthInitial,
    createAction,
    updateAction,
    reorderAction,
    resizeAction,
    duplicateAction,
    archiveAction,
    bulkCreateAction,
    initialContentValue,
    initialFilters,
    createdBlockId,
    initialMessage,
    fallbackPolicyReady = false,
    fallbackPolicyLabel = 'Not ready',
}: ScheduleWorkspaceProps) {
    const activeBlocks = useMemo(
        () => blocks.filter((block) => block.status !== 'archived'),
        [blocks],
    );
    const activeIds = useMemo(() => activeBlocks.map((block) => block.id), [activeBlocks]);
    const options = useMemo(() => buildContentOptions(schedule), [schedule]);
    const initialOption = options.find((option) => option.value === initialContentValue) ?? null;
    const createdBlock = activeBlocks.find((block) => block.id === createdBlockId) ?? null;
    const [orderedIds, setOrderedIds] = useState(activeIds);
    const [drawerMode, setDrawerMode] = useState<DrawerMode>(
        initialOption || (!createdBlock && activeBlocks.length === 0) ? 'add' : 'edit',
    );
    const [selectedBlockId, setSelectedBlockId] = useState(
        createdBlock?.id ?? activeBlocks[0]?.id ?? '',
    );
    const [drawerOpen, setDrawerOpen] = useState(Boolean(initialOption));
    const [loopBuilderOpen, setLoopBuilderOpen] = useState(false);
    const [message, setMessage] = useState<string | null>(initialMessage ?? null);
    const [pendingStartTime, setPendingStartTime] = useState<string | null>(null);
    const [pendingDurationSeconds, setPendingDurationSeconds] = useState<number | null>(null);
    const [isPending, startTransition] = useTransition();
    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
    );
    const blockById = useMemo(
        () => new Map(activeBlocks.map((block) => [block.id, block])),
        [activeBlocks],
    );
    const displayOrderedIds = useMemo(
        () => [
            ...orderedIds.filter((id) => blockById.has(id)),
            ...activeIds.filter((id) => !orderedIds.includes(id)),
        ],
        [activeIds, blockById, orderedIds],
    );
    const orderedBlocks = displayOrderedIds
        .map((id) => blockById.get(id))
        .filter(Boolean) as ProgramBlock[];
    const selectedBlock = blockById.get(selectedBlockId) ?? orderedBlocks[0] ?? null;
    const health = useMemo(
        () =>
            analyzeSchedule(schedule, orderedBlocks, {
                fallbackPolicyReady,
            }),
        [fallbackPolicyReady, orderedBlocks, schedule],
    );

    const openAdd = useCallback((startSeconds?: number, durationSeconds?: number) => {
        setDrawerMode('add');
        setSelectedBlockId('');
        setPendingStartTime(typeof startSeconds === 'number' ? formatTimecode(startSeconds) : null);
        setPendingDurationSeconds(typeof durationSeconds === 'number' ? durationSeconds : null);
        setDrawerOpen(true);
    }, []);

    const openEdit = useCallback((blockId: string) => {
        setDrawerMode('edit');
        setSelectedBlockId(blockId);
        setPendingStartTime(null);
        setPendingDurationSeconds(null);
        setDrawerOpen(true);
    }, []);

    useEffect(() => {
        function openFromHash() {
            if (window.location.hash === '#add-block') {
                openAdd();
            }

            if (window.location.hash === '#bulk-cards') {
                setLoopBuilderOpen(true);
            }
        }

        openFromHash();
        window.addEventListener('hashchange', openFromHash);

        return () => window.removeEventListener('hashchange', openFromHash);
    }, [openAdd]);

    useEffect(() => {
        if (!createdBlock) {
            return;
        }
        const element = document.getElementById(`block-${createdBlock.id}`);

        if (!element) {
            return;
        }
        element.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
        window.setTimeout(() => element.focus({ preventScroll: true }), 250);
    }, [createdBlock]);

    function run(action: () => Promise<void>, optimistic?: () => void) {
        setMessage(null);
        startTransition(async () => {
            try {
                optimistic?.();
                await action();
            } catch (error) {
                setMessage(error instanceof Error ? error.message : String(error));
                setOrderedIds(activeIds);
            }
        });
    }

    const onDragEnd = useCallback(
        (event: DragEndEvent) => {
            const { active, over } = event;

            if (!over || active.id === over.id) {
                return;
            }
            const oldIndex = displayOrderedIds.indexOf(String(active.id));
            const newIndex = displayOrderedIds.indexOf(String(over.id));
            const nextIds = arrayMove(displayOrderedIds, oldIndex, newIndex);
            run(
                () => reorderAction({ orderedBlockIds: nextIds }),
                () => setOrderedIds(nextIds),
            );
        },
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [displayOrderedIds, reorderAction],
    );

    const handleDuplicate = useCallback(
        (blockId: string) => run(() => duplicateAction({ blockId })),
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [duplicateAction],
    );

    const handleArchive = useCallback(
        (blockId: string) => run(() => archiveAction({ blockId })),
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [archiveAction],
    );

    const editor = drawerOpen ? (
        <BlockEditorModal onClose={() => setDrawerOpen(false)}>
            <BlockDrawer
                key={`${drawerMode}-${selectedBlock?.id ?? 'new'}-${initialContentValue ?? ''}-${pendingStartTime ?? ''}-${pendingDurationSeconds ?? ''}`}
                mode={drawerMode}
                date={date}
                schedule={schedule}
                blocks={activeBlocks}
                block={drawerMode === 'edit' ? selectedBlock : null}
                options={options}
                createAction={createAction}
                updateAction={updateAction}
                resizeAction={resizeAction}
                archiveAction={archiveAction}
                initialContentValue={drawerMode === 'add' ? initialContentValue : undefined}
                initialFilters={drawerMode === 'add' ? initialFilters : undefined}
                initialStartTime={drawerMode === 'add' ? pendingStartTime : null}
                initialDurationSeconds={drawerMode === 'add' ? pendingDurationSeconds : null}
                onClose={() => setDrawerOpen(false)}
            />
        </BlockEditorModal>
    ) : null;

    const toolbarActions = (
        <>
            <button className="btn-primary gap-1.5 px-3 py-1.5 text-sm" type="button" onClick={() => openAdd()}>
                <Plus size={15} aria-hidden="true" />
                Add block
            </button>
            <button
                type="button"
                className="btn-secondary gap-1.5 px-3 py-1.5 text-sm"
                onClick={() => setLoopBuilderOpen(true)}
            >
                <Repeat size={15} aria-hidden="true" />
                Fill range with plates
            </button>
        </>
    );

    return (
        <section id="add-block" className="min-w-0">
            <div className="surface-panel min-w-0 overflow-hidden">
                <ScheduleDayToolbar
                    date={date}
                    timezone={dayMeta.timezone}
                    dayStatus={dayMeta.dayStatus}
                    readyBlocks={dayMeta.readyBlocks}
                    totalBlocks={dayMeta.totalBlocks}
                    totalScheduledSeconds={dayMeta.totalScheduledSeconds}
                    healthCriticalCount={dayMeta.healthCriticalCount}
                    healthWarnCount={dayMeta.healthWarnCount}
                    fallbackPolicyLabel={fallbackPolicyLabel}
                    fallbackPolicyReady={fallbackPolicyReady}
                    actions={toolbarActions}
                />
                <ScheduleHealthPoller date={date} initial={healthInitial} />
                {message ? (
                    <div className="border-b border-danger-line bg-danger-soft px-4 py-2 text-sm font-semibold text-danger-strong">
                        {message}
                    </div>
                ) : null}
                <CalendarScheduleView
                    date={date}
                    schedule={schedule}
                    blocks={orderedBlocks}
                    issues={health.issues}
                    selectedBlockId={drawerOpen && drawerMode === 'edit' ? selectedBlockId : ''}
                    createdBlockId={createdBlock?.id ?? ''}
                    disabled={isPending}
                    sortableBlockIds={displayOrderedIds}
                    sensors={sensors}
                    onDragEnd={onDragEnd}
                    onSelect={openEdit}
                    onAdd={openAdd}
                    onDuplicate={handleDuplicate}
                    onArchive={handleArchive}
                    fallbackPolicyReady={fallbackPolicyReady}
                />
            </div>
            {editor}
            <LoopBuilderModal
                schedule={schedule}
                action={bulkCreateAction}
                open={loopBuilderOpen}
                onClose={() => setLoopBuilderOpen(false)}
            />
        </section>
    );
}

function BlockEditorModal({ children, onClose }: { children: ReactNode; onClose: () => void }) {
    return (
        <div
            className="fixed inset-0 z-[100] grid place-items-center bg-black/60 p-3 backdrop-blur-sm sm:p-6"
            role="presentation"
            onMouseDown={(event) => {
                if (event.target === event.currentTarget) {
                    onClose();
                }
            }}
        >
            <div className="w-full max-w-xl" role="dialog" aria-modal="true">
                {children}
            </div>
        </div>
    );
}
