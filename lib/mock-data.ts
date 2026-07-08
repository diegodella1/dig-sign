import type { MediaAsset, SlideAsset } from './types';

const now = new Date().toISOString();

export const mockMediaAssets: MediaAsset[] = [
    {
        id: 'asset-embed-demo',
        vendorId: 'default',
        title: 'Public Video URL Placeholder',
        sourceType: 'embed',
        mediaKind: 'video',
        assetType: 'video',
        url: 'https://vimeo.com/76979871',
        thumbnailUrl: null,
        durationSeconds: 7200,
        status: 'ready',
        lifecycleState: 'reviewed',
        createdAt: now,
        updatedAt: now,
    },
    {
        id: 'asset-fallback',
        vendorId: 'default',
        title: 'Dig-Sign Fallback Slate',
        sourceType: 'remote_image',
        mediaKind: 'image',
        assetType: 'fallback',
        url: null,
        thumbnailUrl: null,
        durationSeconds: null,
        status: 'ready',
        lifecycleState: 'reviewed',
        createdAt: now,
        updatedAt: now,
    },
];

export const mockSlideAssets: SlideAsset[] = [
    {
        id: 'slide-weather',
        vendorId: 'default',
        title: 'Weather',
        slideType: 'template',
        templateId: 'weather',
        content: 'Weather plate',
        defaultDurationSeconds: 30,
        status: 'ready',
        metadata: {
            weatherLocationName: 'Buenos Aires',
            weatherLat: -34.6037,
            weatherLon: -58.3816,
        },
        createdAt: now,
        updatedAt: now,
    },
];
