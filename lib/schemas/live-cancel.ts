import { z } from 'zod';

export const liveCancelSchema = z.object({
    blockId: z.string().optional(),
});
export type LiveCancelInput = z.infer<typeof liveCancelSchema>;
