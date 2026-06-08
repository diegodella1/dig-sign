import { describe, expect, it, vi } from 'vitest';

import { getWeatherSlideData } from './weather';

import type { SlideAsset } from '@/lib/types';

const weatherSlide: SlideAsset = {
    id: 'slide-weather-1',
    title: 'Miami Weather',
    slideType: 'template',
    templateId: 'weather',
    content: 'Weather plate for Miami.',
    imageUrl: null,
    htmlContent: null,
    defaultDurationSeconds: 30,
    status: 'ready',
    metadata: {
        weatherLocationName: 'Miami',
        weatherLat: 25.7617,
        weatherLon: -80.1918,
        youtubeUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        youtubeVideoId: 'dQw4w9WgXcQ',
        youtubeMuted: true,
    },
    createdAt: '2026-06-01T00:00:00.000Z',
    updatedAt: '2026-06-01T00:00:00.000Z',
};

describe('getWeatherSlideData background video', () => {
    it('attaches backgroundVideo from slide metadata', async () => {
        vi.spyOn(global, 'fetch').mockRejectedValue(new Error('offline'));

        const data = await getWeatherSlideData({ slide: weatherSlide });

        expect(data.backgroundVideo).toEqual({ videoId: 'dQw4w9WgXcQ' });
    });
});
