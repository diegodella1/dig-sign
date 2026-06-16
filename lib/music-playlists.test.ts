import { beforeEach, describe, expect, it, vi } from 'vitest';

const selectMock = vi.fn();
const insertMock = vi.fn();
const updateMock = vi.fn();
const deleteMock = vi.fn();

vi.mock('@/lib/db/client', () => ({
    getDb: vi.fn(async () => ({
        select: selectMock,
        insert: insertMock,
        update: updateMock,
        delete: deleteMock,
    })),
}));

import {
    getMusicOutputSettings,
    saveMusicOutputSettings,
    type MusicOutputSettings,
} from '@/lib/music-playlists';

function chainable(rows: unknown[]) {
    const promise = Promise.resolve(rows);
    const chain = {
        from: () => chain,
        where: () => chain,
        orderBy: () => chain,
        limit: () => promise,
        innerJoin: () => chain,
    };

    return chain;
}

describe('music-playlists settings', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        selectMock.mockImplementation(() => chainable([{ id: 'playlist-existing' }]));
    });

    it('returns default output settings when integration row is missing', async () => {
        selectMock
            .mockImplementationOnce(() => chainable([{ id: 'playlist-existing' }]))
            .mockImplementationOnce(() => chainable([]));

        const settings = await getMusicOutputSettings();

        expect(settings).toEqual({
            enabled: false,
            volume: 50,
            fade: 'short',
            schedulePlaylistId: null,
            fallbackPlaylistId: null,
        } satisfies MusicOutputSettings);
    });

    it('persists merged output settings', async () => {
        selectMock
            .mockImplementationOnce(() => chainable([{ id: 'playlist-existing' }]))
            .mockImplementationOnce(() =>
                chainable([
                    {
                        publicConfig: {
                            enabled: false,
                            volume: 50,
                            fade: 'short',
                            schedulePlaylistId: 'playlist-a',
                            fallbackPlaylistId: 'playlist-b',
                        },
                    },
                ]),
            )
            .mockImplementationOnce(() =>
                chainable([
                    {
                        publicConfig: {
                            enabled: false,
                            volume: 50,
                            fade: 'short',
                            schedulePlaylistId: 'playlist-a',
                            fallbackPlaylistId: 'playlist-b',
                        },
                    },
                ]),
            );

        insertMock.mockReturnValue({
            values: () => ({
                onConflictDoUpdate: () => Promise.resolve(),
            }),
        });

        const next = await saveMusicOutputSettings({
            enabled: true,
            volume: 33,
            schedulePlaylistId: 'playlist-a',
        });

        expect(next.enabled).toBe(true);
        expect(next.volume).toBe(33);
        expect(next.schedulePlaylistId).toBe('playlist-a');
        expect(next.fallbackPlaylistId).toBe('playlist-b');
    });
});
