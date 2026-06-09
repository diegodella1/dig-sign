import { describe, expect, it } from 'vitest';

import {
    getWeatherBackgroundVideo,
    getYouTubeSlideConfig,
    parseYouTubeVideoId,
    weatherBackgroundMetadata,
    youTubeBackgroundEmbedUrl,
    youTubeEmbedUrl,
    youtubeSlideMetadata,
} from './youtube';

describe('youtube helpers', () => {
    it('parses youtube ids from common urls', () => {
        expect(parseYouTubeVideoId('dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ');
        expect(parseYouTubeVideoId('https://youtu.be/dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ');
        expect(parseYouTubeVideoId('https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=5s')).toBe(
            'dQw4w9WgXcQ',
        );
    });

    it('builds embed urls with hidden controls and loop', () => {
        const url = youTubeEmbedUrl({
            videoId: 'dQw4w9WgXcQ',
            zoom: 1.25,
            muted: true,
            loop: true,
            startSeconds: 7,
        });

        expect(url).toContain('youtube-nocookie.com/embed/dQw4w9WgXcQ');
        expect(url).toContain('controls=0');
        expect(url).toContain('loop=1');
        expect(url).toContain('playlist=dQw4w9WgXcQ');
        expect(url).toContain('start=7');
    });

    it('builds background embed urls for muted live-style playback', () => {
        const url = youTubeBackgroundEmbedUrl('dQw4w9WgXcQ');

        expect(url).toContain('youtube-nocookie.com/embed/dQw4w9WgXcQ');
        expect(url).toContain('mute=1');
        expect(url).toContain('enablejsapi=1');
        expect(url).not.toContain('loop=1');
        expect(url).not.toContain('playlist=');
    });

    it('builds weather background metadata from valid urls', () => {
        expect(
            weatherBackgroundMetadata('https://www.youtube.com/watch?v=dQw4w9WgXcQ'),
        ).toEqual({
            youtubeUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
            youtubeVideoId: 'dQw4w9WgXcQ',
            youtubeMuted: true,
        });
        expect(weatherBackgroundMetadata('')).toBeNull();
        expect(weatherBackgroundMetadata('https://www.youtube.com/@channel/live')).toBeNull();
    });

    it('reads weather background video ids from weather plates only', () => {
        expect(
            getWeatherBackgroundVideo({
                id: 'slide-weather-1',
                title: 'Miami Weather',
                slideType: 'template',
                templateId: 'weather',
                content: '',
                imageUrl: null,
                htmlContent: null,
                defaultDurationSeconds: 30,
                status: 'ready',
                metadata: {
                    youtubeUrl: 'https://youtu.be/dQw4w9WgXcQ',
                    youtubeVideoId: 'dQw4w9WgXcQ',
                },
                createdAt: '2026-06-01T00:00:00.000Z',
                updatedAt: '2026-06-01T00:00:00.000Z',
            }),
        ).toEqual({ videoId: 'dQw4w9WgXcQ' });
        expect(
            getWeatherBackgroundVideo({
                id: 'slide-youtube-1',
                title: 'YouTube',
                slideType: 'html',
                templateId: null,
                content: null,
                imageUrl: null,
                htmlContent: null,
                defaultDurationSeconds: 30,
                status: 'ready',
                metadata: { youtubeVideoId: 'dQw4w9WgXcQ' },
                createdAt: '2026-06-01T00:00:00.000Z',
                updatedAt: '2026-06-01T00:00:00.000Z',
            }),
        ).toBeNull();
    });

    it('reads youtube config from html slides metadata', () => {
        const metadata = youtubeSlideMetadata({
            url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
            zoom: '1.25',
            muted: true,
            loop: true,
            startSeconds: 9,
        });

        const config = getYouTubeSlideConfig({
            id: 'slide-youtube-1',
            title: 'YouTube',
            slideType: 'html',
            content: null,
            imageUrl: null,
            htmlContent: null,
            templateId: null,
            defaultDurationSeconds: 30,
            status: 'ready',
            metadata,
            createdAt: '2026-06-01T00:00:00.000Z',
            updatedAt: '2026-06-01T00:00:00.000Z',
        });

        expect(config).toEqual({
            videoId: 'dQw4w9WgXcQ',
            zoom: 1.25,
            muted: true,
            loop: true,
            startSeconds: 9,
        });
    });
});
