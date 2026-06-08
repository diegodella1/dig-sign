import { describe, expect, it } from 'vitest';

import { inferFallbackPolicyMode, resolveFallbackPolicyStatus } from './fallback-policy';

import type { MediaAsset, SlideAsset } from './types';
import type { FallbackCarousel } from './fallback-carousel';

const slide: SlideAsset = {
    id: 'slide-1',
    title: 'Weather',
    slideType: 'template',
    templateId: 'weather',
    defaultDurationSeconds: 30,
    status: 'ready',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
};

const video: MediaAsset = {
    id: 'video-1',
    title: 'Glitch loop',
    description: null,
    sourceType: 'remote_mp4',
    mediaKind: 'video',
    assetType: 'fallback',
    url: 'https://example.com/glitch.mp4',
    thumbnailUrl: null,
    durationSeconds: 60,
    status: 'ready',
    lifecycleState: 'reviewed',
    vimeoId: null,
    metadata: { fallback_loop: true },
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
};

const carousel: FallbackCarousel = {
    enabled: true,
    activeSetId: 'set-1',
    updatedAt: '2026-01-01T00:00:00.000Z',
    cards: [{ kind: 'slide', id: slide.id, slideId: slide.id, durationSeconds: 30 }],
    sets: [
        {
            id: 'set-1',
            name: 'Morning boards',
            cards: [{ kind: 'slide', id: slide.id, slideId: slide.id, durationSeconds: 30 }],
            createdAt: '2026-01-01T00:00:00.000Z',
            updatedAt: '2026-01-01T00:00:00.000Z',
        },
    ],
};

describe('resolveFallbackPolicyStatus', () => {
    it('marks emergency-only policy as ready', () => {
        const status = resolveFallbackPolicyStatus({
            mediaAssets: [],
            slideAssets: [],
            carousel: { ...carousel, enabled: false },
        });

        expect(status.mode).toBe('emergency_only');
        expect(status.ready).toBe(true);
    });

    it('marks silent video ready when a loop candidate exists', () => {
        const status = resolveFallbackPolicyStatus({
            mediaAssets: [video],
            slideAssets: [],
            carousel: null,
        });

        expect(status.mode).toBe('silent_video');
        expect(status.ready).toBe(true);
        expect(status.label).toContain('Glitch loop');
    });

    it('marks plate rotation ready when the active set has playable cards', () => {
        const status = resolveFallbackPolicyStatus({
            mediaAssets: [],
            slideAssets: [slide],
            carousel,
        });

        expect(status.mode).toBe('plate_rotation');
        expect(status.ready).toBe(true);
        expect(status.label).toContain('Morning boards');
    });

    it('prefers plate rotation when carousel is enabled even if silent video exists', () => {
        expect(
            inferFallbackPolicyMode({
                mediaAssets: [video],
                slideAssets: [slide],
                carousel,
            }),
        ).toBe('plate_rotation');
    });
});
