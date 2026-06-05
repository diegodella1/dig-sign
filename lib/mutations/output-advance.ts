import { and, eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';

import { auditedMutation } from '../audit/audit';
import { getCurrentOperatorSession } from '../auth/auth';
import { getScheduleForDate } from '../data';
import { getDb } from '../db/client';
import { outputOverrides } from '../db/schema';
import { getGlobalFallbackCarousel } from '../fallback-carousel';
import { err, extractError, ok, type Result } from '../result';
import { findActiveSchedule } from '../scheduling/scheduler';
import { PLAYOUT_TIMEZONE, secondsSinceMidnightInTimezone } from '../helpers/time';

import { resizeProgramBlock } from './blocks';

export async function skipActiveBlock(input: {
    date: string;
    blockId: string;
    elapsedInBlock: number;
}): Promise<Result<void>> {
    try {
        const trimmedDuration = Math.max(1, Math.floor(input.elapsedInBlock) + 1);
        const result = await resizeProgramBlock({
            date: input.date,
            blockId: input.blockId,
            durationSeconds: trimmedDuration,
        });

        if (!result.success) {
            return result;
        }

        revalidateOperatePaths(input.date);

        return ok(undefined);
    } catch (error) {
        return err(extractError(error));
    }
}

export async function forceNextBlockOutput(input: {
    programDayId: string;
    date: string;
    nextBlockId: string;
}): Promise<Result<void>> {
    try {
        const schedule = await getScheduleForDate(input.date);
        const nextBlock = schedule.blocks.find((block) => block.id === input.nextBlockId);

        if (!nextBlock) {
            return err('Next block not found');
        }

        const db = await getDb();
        const operator = await getCurrentOperatorSession();

        await auditedMutation(
            {
                action: 'output_override.next_block',
                entityType: 'output_overrides',
                entityId: input.programDayId,
                metadata: {
                    block_id: nextBlock.id,
                    block_title: nextBlock.title,
                },
            },
            async () => {
                await disableActiveOverrides(db, input.programDayId);

                await db.insert(outputOverrides).values({
                    programDayId: input.programDayId,
                    enabled: true,
                    sourceType: 'scheduled_block',
                    blockId: nextBlock.id,
                    assetId: nextBlock.assetId ?? null,
                    slideId: nextBlock.slideId ?? null,
                    label: nextBlock.title,
                    metadata: { forced_at: new Date().toISOString(), reason: 'go_next' },
                    createdBy:
                        operator?.operatorId === 'bootstrap'
                            ? null
                            : (operator?.operatorId ?? null),
                });
            },
        );

        revalidateOperatePaths(input.date);

        return ok(undefined);
    } catch (error) {
        return err(extractError(error));
    }
}

export async function forceEmergencyLoopOutput(input: {
    programDayId: string;
    date: string;
}): Promise<Result<void>> {
    try {
        const [schedule, carousel] = await Promise.all([
            getScheduleForDate(input.date),
            getGlobalFallbackCarousel(),
        ]);
        const timezone = schedule.day?.timezone ?? PLAYOUT_TIMEZONE;
        const nowSeconds = secondsSinceMidnightInTimezone(new Date(), timezone);
        const active = findActiveSchedule(schedule, nowSeconds);

        if (active.block) {
            const skip = await skipActiveBlock({
                date: input.date,
                blockId: active.block.id,
                elapsedInBlock: active.elapsedInBlock,
            });

            if (!skip.success) {
                return skip;
            }
        }

        const card = carousel?.enabled ? carousel.cards[0] : null;

        if (!card) {
            revalidateOperatePaths(input.date);

            return ok(undefined);
        }

        const db = await getDb();
        const operator = await getCurrentOperatorSession();
        const slideId = card.kind === 'slide' ? (card.slideId ?? card.id) : null;
        const assetId = card.kind === 'asset' ? (card.assetId ?? card.id) : null;

        await auditedMutation(
            {
                action: 'output_override.emergency_loop',
                entityType: 'output_overrides',
                entityId: input.programDayId,
                metadata: { card_kind: card.kind, card_id: card.id },
            },
            async () => {
                await disableActiveOverrides(db, input.programDayId);

                await db.insert(outputOverrides).values({
                    programDayId: input.programDayId,
                    enabled: true,
                    sourceType: card.kind === 'slide' ? 'slide' : 'remote_image',
                    slideId,
                    assetId,
                    label: 'Emergency loop',
                    metadata: { forced_at: new Date().toISOString(), reason: 'emergency_loop' },
                    createdBy:
                        operator?.operatorId === 'bootstrap'
                            ? null
                            : (operator?.operatorId ?? null),
                });
            },
        );

        revalidateOperatePaths(input.date);

        return ok(undefined);
    } catch (error) {
        return err(extractError(error));
    }
}

async function disableActiveOverrides(
    db: Awaited<ReturnType<typeof getDb>>,
    programDayId: string,
) {
    await db
        .update(outputOverrides)
        .set({ enabled: false, updatedAt: new Date().toISOString() })
        .where(and(eq(outputOverrides.programDayId, programDayId), eq(outputOverrides.enabled, true)));
}

function revalidateOperatePaths(date: string) {
    revalidatePath('/admin/operate');
    revalidatePath('/admin/output');
    revalidatePath(`/admin/schedule/${date}`);
}
