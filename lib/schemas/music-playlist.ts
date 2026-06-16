import { z } from 'zod';

export const musicPlaylistStatusSchema = z.enum(['draft', 'ready', 'archived']);

export const createMusicPlaylistSchema = z.object({
    name: z.string().trim().min(1).max(120),
    status: musicPlaylistStatusSchema.optional(),
});

export const updateMusicPlaylistSchema = z.object({
    name: z.string().trim().min(1).max(120).optional(),
    status: musicPlaylistStatusSchema.optional(),
});

export const setMusicPlaylistItemsSchema = z.object({
    assetIds: z.array(z.string().uuid()).max(200),
});

export const musicOutputSettingsSchema = z
    .object({
        enabled: z.unknown().optional(),
        volume: z.unknown().optional(),
        fade: z.unknown().optional(),
        schedulePlaylistId: z.string().uuid().nullable().optional(),
        fallbackPlaylistId: z.string().uuid().nullable().optional(),
    })
    .passthrough();

export type CreateMusicPlaylistInput = z.infer<typeof createMusicPlaylistSchema>;
export type UpdateMusicPlaylistInput = z.infer<typeof updateMusicPlaylistSchema>;
export type SetMusicPlaylistItemsInput = z.infer<typeof setMusicPlaylistItemsSchema>;
export type MusicOutputSettingsInput = z.infer<typeof musicOutputSettingsSchema>;
