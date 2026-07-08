import { describe, expect, it } from 'vitest';

import {
    isPlayableContentPlaylist,
    resolveActiveAssignment,
    selectPlaylistCarouselItem,
    type PlaylistAssignment,
    type PlaylistCarouselCard,
} from './content-playlists';
import { cardsFromPlaylistItems } from '@/components/prepare/loop-editor-utils';

import type { MediaAsset, SlideAsset } from './types';

const baseAssignment = (overrides: Partial<PlaylistAssignment> = {}): PlaylistAssignment => ({
    id: 'a1',
    screenId: 's1',
    playlistId: 'p1',
    startDate: null,
    endDate: null,
    weekdays: [],
    priority: 0,
    status: 'active',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
});

describe('resolveActiveAssignment', () => {
    it('picks the highest priority assignment for the date and weekday', () => {
        const assignments = [
            baseAssignment({ id: 'low', priority: 1, playlistId: 'low' }),
            baseAssignment({ id: 'high', priority: 10, playlistId: 'high' }),
        ];

        expect(resolveActiveAssignment(assignments, '2026-07-08', 'wed')?.playlistId).toBe('high');
    });

    it('respects date range and weekday filters', () => {
        const assignments = [
            baseAssignment({
                id: 'weekend',
                playlistId: 'weekend',
                weekdays: ['sat', 'sun'],
            }),
            baseAssignment({
                id: 'weekday',
                playlistId: 'weekday',
                weekdays: ['mon', 'tue', 'wed', 'thu', 'fri'],
                priority: 1,
            }),
        ];

        expect(resolveActiveAssignment(assignments, '2026-07-08', 'wed')?.playlistId).toBe(
            'weekday',
        );
        expect(resolveActiveAssignment(assignments, '2026-07-11', 'sat')?.playlistId).toBe(
            'weekend',
        );
        expect(
            resolveActiveAssignment(
                [baseAssignment({ startDate: '2026-07-10', endDate: '2026-07-12' })],
                '2026-07-08',
                'wed',
            ),
        ).toBeNull();
    });
});

describe('isPlayableContentPlaylist', () => {
    it('only allows approved ready playlists with items', () => {
        expect(
            isPlayableContentPlaylist({
                status: 'ready',
                approvalState: 'approved',
                itemCount: 1,
            }),
        ).toBe(true);
        expect(
            isPlayableContentPlaylist({
                status: 'ready',
                approvalState: 'submitted',
                itemCount: 1,
            }),
        ).toBe(false);
        expect(
            isPlayableContentPlaylist({
                status: 'ready',
                approvalState: 'approved',
                itemCount: 0,
            }),
        ).toBe(false);
    });
});

describe('selectPlaylistCarouselItem', () => {
    const slide: SlideAsset = {
        id: 'slide-1',
        title: 'Slide',
        status: 'ready',
        slideType: 'html',
        templateId: null,
        imageUrl: null,
        content: 'hello',
        htmlContent: null,
        defaultDurationSeconds: 10,
        updatedAt: '2026-01-01T00:00:00.000Z',
        createdAt: '2026-01-01T00:00:00.000Z',
        metadata: {},
    };

    const asset: MediaAsset = {
        id: 'asset-1',
        title: 'Promo',
        status: 'ready',
        mediaKind: 'video',
        assetType: 'promo',
        sourceType: 'remote_mp4',
        url: 'https://example.com/video.mp4',
        durationSeconds: 20,
        updatedAt: '2026-01-01T00:00:00.000Z',
        createdAt: '2026-01-01T00:00:00.000Z',
        description: '',
        thumbnailUrl: '',
        storagePath: null,
        lifecycleState: 'reviewed',
        playbackReadinessStatus: 'ready',
        playbackError: null,
        metadata: {},
    };

    const cards: PlaylistCarouselCard[] = [
        { kind: 'slide', id: slide.id, durationSeconds: 10 },
        { kind: 'asset', id: asset.id, durationSeconds: 20 },
    ];

    it('rotates through playlist cards based on server seconds', () => {
        const first = selectPlaylistCarouselItem(
            cards,
            { mediaAssets: [asset], slideAssets: [slide] },
            5,
            '2026-01-01T00:00:00.000Z',
        );
        const second = selectPlaylistCarouselItem(
            cards,
            { mediaAssets: [asset], slideAssets: [slide] },
            15,
            '2026-01-01T00:00:00.000Z',
        );

        expect(first?.kind).toBe('slide');
        expect(first?.elapsedSeconds).toBe(5);
        expect(second?.kind).toBe('asset');
        expect(second?.elapsedSeconds).toBe(5);
    });
});

describe('cardsFromPlaylistItems', () => {
    it('maps saved playlist rows into loop editor cards', () => {
        const slideRow: SlideAsset = {
            id: 'slide-1',
            title: 'Slide',
            status: 'ready',
            slideType: 'html',
            templateId: null,
            imageUrl: null,
            content: 'hello',
            htmlContent: null,
            defaultDurationSeconds: 10,
            updatedAt: '2026-01-01T00:00:00.000Z',
            createdAt: '2026-01-01T00:00:00.000Z',
            metadata: {},
        };
        const assetRow: MediaAsset = {
            id: 'asset-1',
            title: 'Promo',
            status: 'ready',
            mediaKind: 'video',
            assetType: 'promo',
            sourceType: 'remote_mp4',
            url: 'https://example.com/video.mp4',
            durationSeconds: 20,
            updatedAt: '2026-01-01T00:00:00.000Z',
            createdAt: '2026-01-01T00:00:00.000Z',
            description: '',
            thumbnailUrl: '',
            storagePath: null,
            lifecycleState: 'reviewed',
            playbackReadinessStatus: 'ready',
            playbackError: null,
            metadata: {},
        };
        const cards = cardsFromPlaylistItems(
            [
                { slideId: slideRow.id, assetId: null, durationSeconds: null },
                { slideId: null, assetId: assetRow.id, durationSeconds: 8 },
            ],
            new Map([[slideRow.id, slideRow]]),
            new Map([[assetRow.id, assetRow]]),
        );

        expect(cards).toHaveLength(2);
        expect(cards[0]).toMatchObject({ kind: 'slide', id: slideRow.id, durationSeconds: 10 });
        expect(cards[1]).toMatchObject({ kind: 'asset', id: assetRow.id, durationSeconds: 8 });
    });
});
