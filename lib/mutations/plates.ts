import { revalidatePath } from 'next/cache';
import { and, eq } from 'drizzle-orm';

import { auditedMutation } from '../audit/audit';
import { err, extractError, ok, type Result } from '../result';
import { getDb } from '../db/client';
import { slideAssets } from '../db/schema';
import { weatherBackgroundMetadata, youtubeSlideMetadata } from '../slides/youtube';

import { createSlideAsset } from './assets';

export type WeatherPlateBaseInput = {
    title: string;
    locationName: string;
    lat: number;
    lon: number;
    youtubeUrl?: string | undefined;
    defaultDurationSeconds?: number | undefined;
    status?: string | undefined;
};

export type YouTubeSlideInput = {
    title: string;
    url: string;
    zoom?: number | string | undefined;
    muted?: boolean | string | undefined;
    loop?: boolean | string | undefined;
    startSeconds?: number | string | undefined;
    defaultDurationSeconds?: number | undefined;
    status?: string | undefined;
};

type WeatherLocationInput = { locationName: string; lat: number; lon: number };

function normalizeWeatherLocation(input: WeatherLocationInput): Result<WeatherLocationInput> {
    const locationName = input.locationName.trim();
    const lat = Number(input.lat);
    const lon = Number(input.lon);

    if (!locationName) {
        return err('City name is required');
    }

    if (!Number.isFinite(lat) || lat < -90 || lat > 90) {
        return err('Latitude is invalid');
    }

    if (!Number.isFinite(lon) || lon < -180 || lon > 180) {
        return err('Longitude is invalid');
    }

    return ok({ locationName, lat, lon });
}

function buildWeatherPlateMetadata(
    location: WeatherLocationInput,
    youtubeUrl?: string | undefined,
): Result<Record<string, unknown>> {
    const base = {
        weatherLocationName: location.locationName,
        weatherLat: location.lat,
        weatherLon: location.lon,
    };
    const trimmedUrl = youtubeUrl?.trim() ?? '';

    if (!trimmedUrl) {
        return ok(base);
    }

    const youtube = weatherBackgroundMetadata(trimmedUrl);

    if (!youtube) {
        return err('Invalid YouTube URL. Use a watch?v= or youtu.be link.');
    }

    return ok({
        ...base,
        ...youtube,
    });
}

function normalizeWeatherStatus(status: string | undefined): 'draft' | 'archived' | 'ready' {
    if (status === 'draft' || status === 'archived') {
        return status;
    }

    return 'ready';
}

export async function createWeatherPlate(input: WeatherPlateBaseInput): Promise<Result<void>> {
    try {
        const normalized = normalizeWeatherLocation(input);

        if (!normalized.success) {
            return normalized;
        }

        const metadata = buildWeatherPlateMetadata(normalized.data, input.youtubeUrl);

        if (!metadata.success) {
            return metadata;
        }

        const result = await createSlideAsset({
            title: input.title,
            slideType: 'template',
            templateId: 'weather',
            content: `Weather plate for ${normalized.data.locationName}.`,
            defaultDurationSeconds: input.defaultDurationSeconds ?? 30,
            status: input.status || 'ready',
            metadata: metadata.data,
        });

        if (!result.success) {
            return result;
        }

        revalidatePath('/admin/slides');

        return ok(undefined);
    } catch (error) {
        return err(extractError(error));
    }
}

export async function updateWeatherPlate(
    input: WeatherPlateBaseInput & { slideId: string },
): Promise<Result<void>> {
    try {
        const normalized = normalizeWeatherLocation(input);

        if (!normalized.success) {
            return normalized;
        }

        const metadata = buildWeatherPlateMetadata(normalized.data, input.youtubeUrl);

        if (!metadata.success) {
            return metadata;
        }

        const status = normalizeWeatherStatus(input.status);
        const db = await getDb();

        await auditedMutation(
            {
                action: 'weather_plate.updated',
                entityType: 'slide_assets',
                entityId: input.slideId,
                next: { title: input.title, status, locationName: normalized.data.locationName },
            },
            async () => {
                await db
                    .update(slideAssets)
                    .set({
                        title: input.title,
                        content: `Weather plate for ${normalized.data.locationName}.`,
                        defaultDurationSeconds: input.defaultDurationSeconds ?? 30,
                        status,
                        metadata: metadata.data,
                        updatedAt: new Date().toISOString(),
                    })
                    .where(
                        and(
                            eq(slideAssets.id, input.slideId),
                            eq(slideAssets.templateId, 'weather'),
                        ),
                    );
            },
        );
        revalidatePath('/admin/slides');

        return ok(undefined);
    } catch (error) {
        return err(extractError(error));
    }
}

export async function createYouTubeSlide(input: YouTubeSlideInput): Promise<Result<void>> {
    try {
        const title = input.title.trim();
        const metadata = youtubeSlideMetadata({
            url: input.url,
            zoom: input.zoom,
            muted: input.muted,
            loop: input.loop,
            startSeconds: input.startSeconds,
        });

        if (!title) {
            return err('Title is required');
        }

        if (!metadata) {
            return err('YouTube URL is invalid');
        }

        const result = await createSlideAsset({
            title,
            slideType: 'html',
            content: `YouTube video ${metadata.youtubeVideoId}`,
            defaultDurationSeconds: input.defaultDurationSeconds ?? 30,
            status: input.status || 'ready',
            metadata,
        });

        if (!result.success) {
            return result;
        }

        revalidatePath('/admin/slides');

        return ok(undefined);
    } catch (error) {
        return err(extractError(error));
    }
}
