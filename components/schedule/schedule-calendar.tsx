'use client';

import type { DragEndEvent, SensorDescriptor } from '@dnd-kit/core';
import type { MouseEvent, PointerEvent } from 'react';
import { useEffect, useRef, useState } from 'react';

import { findSameDayGaps } from '@/lib/scheduling/schedule-conflicts';
import type { ProgramBlock, ScheduleBundle } from '@/lib/types';
import type { ScheduleIssue } from '@/lib/scheduling/schedule-health';

import {
    CALENDAR_SNAP_SECONDS,
    DAY_SECONDS,
    buildRundownItems,
    normalizeCalendarSelection,
    snapCalendarSeconds,
    type TimelineZoom,
} from './helpers';
import { useScheduleLiveState } from './use-schedule-live-state';
import { CalendarMiniMap, RundownTable } from './schedule-calendar-panels';

type CalendarScheduleViewProps = {
    date: string;
    schedule: ScheduleBundle;
    blocks: ProgramBlock[];
    issues: ScheduleIssue[];
    selectedBlockId: string;
    createdBlockId: string;
    disabled?: boolean;
    sortableBlockIds: string[];
    sensors: SensorDescriptor<object>[];
    onDragEnd: (event: DragEndEvent) => void;
    onSelect: (blockId: string) => void;
    onAdd: (startSeconds?: number, durationSeconds?: number) => void;
    onDuplicate: (blockId: string) => void;
    onArchive: (blockId: string) => void;
    fallbackPolicyReady?: boolean;
};

export function CalendarScheduleView({
    date,
    schedule,
    blocks,
    issues,
    selectedBlockId,
    createdBlockId,
    disabled = false,
    sortableBlockIds,
    sensors,
    onDragEnd,
    onSelect,
    onAdd,
    onDuplicate,
    onArchive,
    fallbackPolicyReady = false,
}: CalendarScheduleViewProps) {
    const [zoom, setZoom] = useState<TimelineZoom>('work');
    const [dragStartSeconds, setDragStartSeconds] = useState<number | null>(null);
    const [dragCurrentSeconds, setDragCurrentSeconds] = useState<number | null>(null);
    const [viewportStartSeconds, setViewportStartSeconds] = useState(0);
    const [viewportDurationSeconds, setViewportDurationSeconds] = useState(6 * 3600);
    const hasAutoScrolledRef = useRef(false);
    const suppressClickRef = useRef(false);
    const pointerSelectionRef = useRef(false);
    const timezone = schedule.day?.timezone ?? 'America/Los_Angeles';
    const liveState = useScheduleLiveState(date, timezone, blocks);
    const gaps = schedule.day ? findSameDayGaps(blocks, schedule.day.id) : [];
    const issueMap = new Map(
        issues.filter((issue) => issue.blockId).map((issue) => [issue.blockId, issue]),
    );
    const selection =
        dragStartSeconds !== null && dragCurrentSeconds !== null
            ? normalizeCalendarSelection(dragStartSeconds, dragCurrentSeconds)
            : null;
    const timelineItems = buildRundownItems(blocks, gaps);
    const rundownItems =
        blocks.length === 0
            ? timelineItems.filter((item) => item.kind === 'block')
            : timelineItems;
    const nextGap = gaps.find(
        (gap) => gap.durationSeconds > 0 && gap.startTimeSeconds >= (liveState.nowSeconds ?? 0),
    );

    useEffect(() => {
        hasAutoScrolledRef.current = false;
    }, [date]);

    useEffect(() => {
        if (!liveState.isToday || liveState.nowSeconds === null || hasAutoScrolledRef.current) {
            return;
        }
        showNow();
        hasAutoScrolledRef.current = true;
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [liveState.isToday, liveState.nowSeconds]);

    function setViewport(startSeconds: number, durationSeconds = viewportDurationSeconds) {
        const safeDuration = Math.max(15 * 60, Math.min(DAY_SECONDS, durationSeconds));
        setViewportDurationSeconds(safeDuration);
        setViewportStartSeconds(
            Math.max(0, Math.min(DAY_SECONDS - safeDuration, Math.floor(startSeconds))),
        );
    }

    function showNow() {
        const nowSeconds = liveState.nowSeconds ?? 0;
        setZoom('work');
        setViewport(Math.max(0, nowSeconds - 5 * 60), 30 * 60);
    }

    function showNextGap() {
        const gap = nextGap ?? gaps[0];

        if (!gap) {
            return;
        }
        setZoom('work');
        setViewport(Math.max(0, gap.startTimeSeconds - 5 * 60), 30 * 60);
    }

    function showFullDay() {
        setZoom('overview');
        setViewport(0, DAY_SECONDS);
    }

    function zoomBy(delta: number) {
        const order: TimelineZoom[] = ['overview', 'work', 'detail'];
        const index = order.indexOf(zoom);
        const next = order[Math.max(0, Math.min(order.length - 1, index + delta))] ?? 'work';
        setZoom(next);

        if (next === 'overview') {
            setViewport(0, DAY_SECONDS);
        } else if (next === 'work') {
            setViewport(viewportStartSeconds, 6 * 3600);
        } else {
            setViewport(viewportStartSeconds, 60 * 60);
        }
    }

    function secondsFromPointer(event: MouseEvent<HTMLDivElement> | PointerEvent<HTMLDivElement>) {
        const rect = event.currentTarget.getBoundingClientRect();
        const ratio = Math.max(0, Math.min(1, (event.clientY - rect.top) / rect.height));

        return snapCalendarSeconds(Math.round(ratio * DAY_SECONDS));
    }

    function addAtPointer(event: MouseEvent<HTMLDivElement>) {
        if (suppressClickRef.current) {
            suppressClickRef.current = false;

            return;
        }
        onAdd(secondsFromPointer(event));
    }

    function startSelection(event: PointerEvent<HTMLDivElement>) {
        if (event.button !== 0) {
            return;
        }
        pointerSelectionRef.current = true;
        const seconds = secondsFromPointer(event);
        setDragStartSeconds(seconds);
        setDragCurrentSeconds(seconds);
        event.currentTarget.setPointerCapture(event.pointerId);
    }

    function updateSelection(event: PointerEvent<HTMLDivElement>) {
        if (dragStartSeconds === null) {
            return;
        }
        setDragCurrentSeconds(secondsFromPointer(event));
    }

    function finishSelection(event: PointerEvent<HTMLDivElement>) {
        if (dragStartSeconds === null || dragCurrentSeconds === null) {
            return;
        }
        const next = normalizeCalendarSelection(dragStartSeconds, dragCurrentSeconds);
        setDragStartSeconds(null);
        setDragCurrentSeconds(null);
        event.currentTarget.releasePointerCapture(event.pointerId);
        window.setTimeout(() => {
            pointerSelectionRef.current = false;
        }, 0);

        if (next.durationSeconds > CALENDAR_SNAP_SECONDS) {
            suppressClickRef.current = true;
            onAdd(next.startSeconds, next.durationSeconds);
        }
    }

    function startMouseSelection(event: MouseEvent<HTMLDivElement>) {
        if (pointerSelectionRef.current) {
            return;
        }
        const seconds = secondsFromPointer(event);
        setDragStartSeconds(seconds);
        setDragCurrentSeconds(seconds);
    }

    function updateMouseSelection(event: MouseEvent<HTMLDivElement>) {
        if (dragStartSeconds === null || pointerSelectionRef.current) {
            return;
        }
        setDragCurrentSeconds(secondsFromPointer(event));
    }

    function finishMouseSelection() {
        if (dragStartSeconds === null || dragCurrentSeconds === null || pointerSelectionRef.current) {
            return;
        }
        const next = normalizeCalendarSelection(dragStartSeconds, dragCurrentSeconds);
        setDragStartSeconds(null);
        setDragCurrentSeconds(null);

        if (next.durationSeconds > CALENDAR_SNAP_SECONDS) {
            suppressClickRef.current = true;
            onAdd(next.startSeconds, next.durationSeconds);
        }
    }

    const viewControls = (
        <CalendarViewControls
            zoom={zoom}
            isToday={liveState.isToday}
            hasGaps={gaps.length > 0}
            onShowNow={showNow}
            onShowNextGap={showNextGap}
            onShowFullDay={showFullDay}
            onZoomBy={zoomBy}
        />
    );

    return (
        <div className="bg-panel">
            <div className="grid gap-3 p-3 xl:grid-cols-[minmax(0,1fr)_148px] xl:items-start">
                <div className="min-w-0">
                    <div className="mb-2 flex flex-wrap items-center justify-between gap-2 xl:hidden">
                        <span className="text-xs text-muted">Drag rows to reorder</span>
                        {viewControls}
                    </div>
                    <RundownTable
                        items={rundownItems}
                        selectedBlockId={selectedBlockId}
                        createdBlockId={createdBlockId}
                        fallbackPolicyReady={fallbackPolicyReady}
                        liveState={liveState}
                        issueMap={issueMap}
                        disabled={disabled}
                        sortableBlockIds={sortableBlockIds}
                        sensors={sensors}
                        onDragEnd={onDragEnd}
                        onSelect={onSelect}
                        onAdd={onAdd}
                        onDuplicate={onDuplicate}
                        onArchive={onArchive}
                        headerTrailing={<div className="hidden xl:flex">{viewControls}</div>}
                    />
                </div>
                <div className="hidden xl:block">
                    <div className="sticky top-[7.5rem]">
                        <CalendarMiniMap
                            blocks={blocks}
                            gaps={gaps}
                            selection={selection}
                            selectedBlockId={selectedBlockId}
                            createdBlockId={createdBlockId}
                            viewportStartSeconds={viewportStartSeconds}
                            viewportDurationSeconds={viewportDurationSeconds}
                            liveState={liveState}
                            onSelect={onSelect}
                            onAdd={onAdd}
                            addAtPointer={addAtPointer}
                            startSelection={startSelection}
                            updateSelection={updateSelection}
                            finishSelection={finishSelection}
                            startMouseSelection={startMouseSelection}
                            updateMouseSelection={updateMouseSelection}
                            finishMouseSelection={finishMouseSelection}
                            onPointerCancel={() => {
                                setDragStartSeconds(null);
                                setDragCurrentSeconds(null);
                                pointerSelectionRef.current = false;
                            }}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}

type CalendarViewControlsProps = {
    zoom: TimelineZoom;
    isToday: boolean;
    hasGaps: boolean;
    onShowNow: () => void;
    onShowNextGap: () => void;
    onShowFullDay: () => void;
    onZoomBy: (delta: number) => void;
};

function CalendarViewControls({
    zoom,
    isToday,
    hasGaps,
    onShowNow,
    onShowNextGap,
    onShowFullDay,
    onZoomBy,
}: CalendarViewControlsProps) {
    return (
        <div className="flex flex-wrap items-center gap-1.5">
            <button
                type="button"
                className="btn-secondary min-h-7 px-2 text-xs"
                onClick={onShowNow}
                disabled={!isToday}
            >
                Now
            </button>
            <button
                type="button"
                className="btn-secondary min-h-7 px-2 text-xs"
                onClick={onShowNextGap}
                disabled={!hasGaps}
            >
                Gap
            </button>
            <button type="button" className="btn-secondary min-h-7 px-2 text-xs" onClick={onShowFullDay}>
                Full day
            </button>
            <div className="flex rounded-md border border-line bg-surface p-0.5" aria-label="Zoom">
                <button
                    type="button"
                    className="min-h-6 rounded px-1.5 text-xs font-semibold text-muted hover:bg-panel-soft"
                    onClick={() => onZoomBy(-1)}
                >
                    −
                </button>
                <span className="grid min-h-6 min-w-14 place-items-center rounded bg-ink px-1.5 text-[10px] font-semibold capitalize text-surface">
                    {zoom}
                </span>
                <button
                    type="button"
                    className="min-h-6 rounded px-1.5 text-xs font-semibold text-muted hover:bg-panel-soft"
                    onClick={() => onZoomBy(1)}
                >
                    +
                </button>
            </div>
        </div>
    );
}
