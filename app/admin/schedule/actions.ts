'use server';

import { redirect } from 'next/navigation';

import {
    archiveProgramBlock,
    createBulkCardLoop,
    createLongTestSchedule,
    createProgramDayFromTemplate,
    createProgramBlock,
    duplicateProgramBlock,
    ensureProgramDay,
    reorderProgramBlocks,
    resizeProgramBlock,
    updateProgramBlock,
    updateProgramDayStatus,
} from '@/lib/mutations';

function scheduleErrorHref(date: string, error: unknown, anchor = 'add-block') {
    const message = error instanceof Error ? error.message : String(error);

    return `/admin/schedule/${date}?error=${encodeURIComponent(message)}#${anchor}`;
}

function formConflictResolution(formData: FormData) {
    const value = String(formData.get('conflict_resolution') || 'insert_shift');

    if (value === 'archive_conflicts' || value === 'strict') {
        return value;
    }

    return 'insert_shift';
}

export async function addScheduleBlock(date: string, formData: FormData) {
    const result = await createProgramBlock({
        date,
        title: String(formData.get('title')),
        blockType: String(formData.get('block_type')),
        assetId: String(formData.get('asset_id') || ''),
        slideId: String(formData.get('slide_id') || ''),
        startTime: String(formData.get('start_time')),
        durationSeconds: Number(formData.get('duration_seconds')),
        preRollSeconds: Number(formData.get('pre_roll_seconds') || 0),
        postRollSeconds: Number(formData.get('post_roll_seconds') || 0),
        hideOverlays: formData.get('hide_overlays') === 'on',
        conflictResolution: formConflictResolution(formData),
        reutersStreamUrl: String(formData.get('reuters_stream_url') || ''),
        reutersStreamLabel: String(formData.get('reuters_stream_label') || ''),
        reutersStreamExpiresAt: String(formData.get('reuters_stream_expires_at') || ''),
        liveSourceType: String(formData.get('live_source_type') || ''),
        liveUrl: String(formData.get('live_url') || ''),
        previouslyRecordedEnabled: formData.get('previously_recorded_enabled') === 'on',
        previouslyRecordedPosition: String(formData.get('previously_recorded_position') || ''),
    });

    if (!result.success) {
        redirect(scheduleErrorHref(date, new Error(result.error), 'add-block'));
    }

    redirect(
        `/admin/schedule/${date}?created=${encodeURIComponent(result.data.id)}#block-${result.data.id}`,
    );
}

export async function updateScheduleBlockInline(date: string, formData: FormData) {
    const blockId = String(formData.get('block_id'));
    const result = await updateProgramBlock({
        date,
        blockId,
        title: String(formData.get('title')),
        blockType: String(formData.get('block_type')),
        assetId: String(formData.get('asset_id') || ''),
        slideId: String(formData.get('slide_id') || ''),
        startTime: String(formData.get('start_time')),
        durationSeconds: Number(formData.get('duration_seconds')),
        status: String(formData.get('status')),
        hideOverlays: formData.get('hide_overlays') === 'on',
        fallbackAssetId: String(formData.get('fallback_asset_id') || ''),
        notes: String(formData.get('notes') || ''),
        conflictResolution: formConflictResolution(formData),
        reutersStreamUrl: String(formData.get('reuters_stream_url') || ''),
        reutersStreamLabel: String(formData.get('reuters_stream_label') || ''),
        reutersStreamExpiresAt: String(formData.get('reuters_stream_expires_at') || ''),
        liveSourceType: String(formData.get('live_source_type') || ''),
        liveUrl: String(formData.get('live_url') || ''),
        previouslyRecordedEnabled: formData.get('previously_recorded_enabled') === 'on',
        previouslyRecordedPosition: String(formData.get('previously_recorded_position') || ''),
    });

    if (!result.success) {
        redirect(
            scheduleErrorHref(
                date,
                new Error(result.error),
                blockId ? `block-${blockId}` : 'add-block',
            ),
        );
    }
}

export async function generateLongScheduleForDate(date: string, formData: FormData) {
    const result = await createLongTestSchedule({
        date,
        startTime: String(formData.get('start_time') || '00:00:00'),
        totalHours: Number(formData.get('total_hours') || 12),
        programMinutes: Number(formData.get('program_minutes') || 48),
        adBreakMinutes: Number(formData.get('ad_break_minutes') || 4),
        imageBumperSeconds: Number(formData.get('image_bumper_seconds') || 30),
        replaceWindow: formData.get('replace_window') === 'on',
    });

    if (!result.success) {
        redirect(scheduleErrorHref(date, new Error(result.error)));
    }
}

export async function bulkCreateCardLoopForDate(date: string, formData: FormData) {
    const slideIds = formData.getAll('slide_ids').map(String);
    const durations = formData.getAll('durations').map(Number);
    const cards = slideIds.map((slideId, index) => ({
        slideId,
        durationSeconds: durations[index] || 30,
    }));

    const result = await createBulkCardLoop({
        date,
        startTime: String(formData.get('start_time') || '00:00:00'),
        endTime: String(formData.get('end_time') || '00:00:00'),
        cards,
        replaceWindow: formData.get('replace_window') === 'on',
    });

    if (!result.success) {
        redirect(scheduleErrorHref(date, new Error(result.error)));
    }
}

export async function setScheduleDayStatus(date: string, formData: FormData) {
    const result = await updateProgramDayStatus({
        date,
        status: String(formData.get('status')),
        allowWarnings: formData.get('allow_warnings') === 'on',
    });

    if (!result.success) {
        redirect(scheduleErrorHref(date, new Error(result.error)));
    }
}

export async function reorderScheduleRundown(
    date: string,
    input: { orderedBlockIds: string[] },
) {
    const result = await reorderProgramBlocks({ date, orderedBlockIds: input.orderedBlockIds });

    if (!result.success) {
        redirect(scheduleErrorHref(date, new Error(result.error)));
    }
}

export async function resizeScheduleRundownBlock(
    date: string,
    input: { blockId: string; durationSeconds: number },
) {
    const result = await resizeProgramBlock({
        date,
        blockId: input.blockId,
        durationSeconds: input.durationSeconds,
    });

    if (!result.success) {
        redirect(scheduleErrorHref(date, new Error(result.error), `block-${input.blockId}`));
    }
}

export async function duplicateScheduleRundownBlock(date: string, input: { blockId: string }) {
    const result = await duplicateProgramBlock({ date, blockId: input.blockId });

    if (!result.success) {
        redirect(scheduleErrorHref(date, new Error(result.error), `block-${input.blockId}`));
    }
}

export async function archiveScheduleRundownBlock(date: string, input: { blockId: string }) {
    const result = await archiveProgramBlock({ date, blockId: input.blockId });

    if (!result.success) {
        redirect(scheduleErrorHref(date, new Error(result.error), `block-${input.blockId}`));
    }
}

export async function createEmptyScheduleDay(date: string) {
    const result = await ensureProgramDay(date);

    if (!result.success) {
        redirect(scheduleErrorHref(date, new Error(result.error)));
    }

    redirect(`/admin/schedule/${date}`);
}

export async function setupScheduleDayFromTemplate(date: string, formData: FormData) {
    const result = await createProgramDayFromTemplate({
        date,
        templateId: String(formData.get('template_id')),
        startTime: String(formData.get('start_time') || '00:00:00'),
    });

    if (!result.success) {
        redirect(scheduleErrorHref(date, new Error(result.error)));
    }

    redirect(`/admin/schedule/${date}`);
}
