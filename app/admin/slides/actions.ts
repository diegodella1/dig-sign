'use server';

import { revalidatePath } from 'next/cache';

import { getSlides } from '@/lib/data';
import {
    archiveSlideAsset,
    createSlideAsset,
    createWeatherPlate,
    createYouTubeSlide,
    updateWeatherPlate,
} from '@/lib/mutations';
import { isLegacyPlate } from '@/lib/prepare/plate-utils';

function revalidatePlates() {
    revalidatePath('/admin/slides');
    revalidatePath('/admin/prepare');
}

export async function archivePlate(formData: FormData) {
    const result = await archiveSlideAsset(String(formData.get('slide_id')));

    if (!result.success) {
        throw new Error(result.error);
    }

    revalidatePlates();
}

export async function addWeatherPlateAction(formData: FormData) {
    const showAdvanced = formData.get('show_advanced') === 'on';
    const result = await createWeatherPlate({
        title: String(formData.get('title') || ''),
        locationName: String(formData.get('location_name') || ''),
        lat: showAdvanced
            ? Number(formData.get('lat'))
            : Number(formData.get('lat') || -34.6037),
        lon: showAdvanced
            ? Number(formData.get('lon'))
            : Number(formData.get('lon') || -58.3816),
        youtubeUrl: String(formData.get('youtube_url') || ''),
        defaultDurationSeconds: Number(formData.get('default_duration_seconds') || 30),
        status: String(formData.get('status') || 'ready'),
    });

    if (!result.success) {
        throw new Error(result.error);
    }

    revalidatePlates();
}

export async function updateWeatherPlateAction(formData: FormData) {
    const result = await updateWeatherPlate({
        slideId: String(formData.get('slide_id') || ''),
        title: String(formData.get('title') || ''),
        locationName: String(formData.get('location_name') || ''),
        lat: Number(formData.get('lat')),
        lon: Number(formData.get('lon')),
        youtubeUrl: String(formData.get('youtube_url') || ''),
        defaultDurationSeconds: Number(formData.get('default_duration_seconds') || 30),
        status: String(formData.get('status') || 'ready'),
    });

    if (!result.success) {
        throw new Error(result.error);
    }

    revalidatePlates();
}

export async function addYouTubePlateAction(formData: FormData) {
    const result = await createYouTubeSlide({
        title: String(formData.get('title') || ''),
        url: String(formData.get('youtube_url') || ''),
        zoom: String(formData.get('zoom') || '1'),
        muted: formData.get('muted') === 'on',
        loop: formData.get('loop') === 'on',
        startSeconds: Number(formData.get('start_seconds') || 0),
        defaultDurationSeconds: Number(formData.get('default_duration_seconds') || 30),
        status: String(formData.get('status') || 'ready'),
    });

    if (!result.success) {
        throw new Error(result.error);
    }

    revalidatePlates();
}

export async function addCustomPlateAction(formData: FormData) {
    const result = await createSlideAsset({
        title: String(formData.get('title')),
        slideType: String(formData.get('slide_type') || 'image'),
        content: String(formData.get('content') || ''),
        imageUrl: String(formData.get('image_url') || ''),
        defaultDurationSeconds: Number(formData.get('default_duration_seconds') || 30),
        status: String(formData.get('status') || 'ready'),
    });

    if (!result.success) {
        throw new Error(result.error);
    }

    revalidatePlates();
}

export async function archiveLegacyPlatesAction() {
    const existing = await getSlides();

    for (const slide of existing) {
        if (slide.status === 'archived' || !isLegacyPlate(slide)) {
            continue;
        }

        const result = await archiveSlideAsset(slide.id);

        if (!result.success) {
            throw new Error(result.error);
        }
    }

    revalidatePlates();
}
