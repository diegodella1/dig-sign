import { z } from 'zod';

export const liveLowerThirdSchema = z.object({
    visible: z.unknown().optional(),
    text: z.unknown().optional(),
});
export type LiveLowerThirdInput = z.infer<typeof liveLowerThirdSchema>;
