import { z } from 'zod';

export const liveScheduleSchema = z.object({
    date: z.string().optional(),
    title: z.string().optional(),
    startTime: z.string().optional(),
    liveSourceType: z.string().optional(),
    liveUrl: z.string().optional(),
    timingMode: z.string().optional(),
});
export type LiveScheduleInput = z.infer<typeof liveScheduleSchema>;
