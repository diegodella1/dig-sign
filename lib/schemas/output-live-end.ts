import { z } from 'zod';

export const outputLiveEndSchema = z.object({
    blockId: z.string().optional(),
    reason: z.string().optional(),
});
export type OutputLiveEndInput = z.infer<typeof outputLiveEndSchema>;
