'use server';

import { revalidatePath } from 'next/cache';

import { getSlides } from '@/lib/data';
import {
    archiveGuestPlate,
    createGuestPlate,
    updateGuestPlate,
} from '@/lib/mutations/guests';
import {
    archiveSlideAsset,
    createSlideAsset,
    createWeatherPlate,
    createYouTubeSlide,
    updateWeatherPlate,
} from '@/lib/mutations';
import { isLegacyPlate, SYSTEM_SLIDE_PRESETS } from '@/lib/prepare/plate-utils';
import { SLIDE_TEMPLATES } from '@/lib/slides/registry';

function revalidatePlates() {
    revalidatePath('/admin/slides');
    revalidatePath('/admin/prepare');
    revalidatePath('/admin/guests');
}

export async function addDataPlate(formData: FormData) {
    const templateId = String(formData.get('template_id') || '');
    const existing = await getSlides();

    if (
        existing.some((slide) => slide.templateId === templateId && slide.status !== 'archived')
    ) {
        return;
    }

    const template = SLIDE_TEMPLATES.find((entry) => entry.id === templateId);
    const result = await createSlideAsset({
        title: String(formData.get('title') || `${template?.label ?? templateId} plate`),
        slideType: 'template',
        templateId,
        content: String(
            formData.get('content') ||
                `System slide: ${template?.label ?? templateId}. Uses live data when available.`,
        ),
        defaultDurationSeconds: Number(formData.get('default_duration_seconds') || 30),
        status: String(formData.get('status') || 'ready'),
    });

    if (!result.success) {
        throw new Error(result.error);
    }

    revalidatePlates();
}

export async function addAllDataPlates() {
    const existing = await getSlides();
    const existingTemplateIds = new Set(
        existing
            .filter((slide) => slide.status !== 'archived')
            .map((slide) => slide.templateId)
            .filter(Boolean),
    );

    for (const preset of SYSTEM_SLIDE_PRESETS) {
        if (existingTemplateIds.has(preset.templateId)) {
            continue;
        }

        const result = await createSlideAsset({
            title: preset.title,
            slideType: 'template',
            templateId: preset.templateId,
            content: preset.content,
            defaultDurationSeconds: 30,
            status: 'ready',
        });

        if (!result.success) {
            throw new Error(result.error);
        }
    }

    revalidatePlates();
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

export async function addGuestLineupPlateAction(formData: FormData) {
    const result = await createGuestPlate({
        title: String(formData.get('title') || ''),
        guestIds: formData.getAll('guest_ids').map(String),
        defaultDurationSeconds: Number(formData.get('default_duration_seconds') || 30),
        status: String(formData.get('status') || 'ready'),
    });

    if (!result.success) {
        throw new Error(result.error);
    }

    revalidatePlates();
}

export async function updateGuestLineupPlateAction(formData: FormData) {
    const result = await updateGuestPlate({
        slideId: String(formData.get('slide_id') || ''),
        title: String(formData.get('title') || ''),
        guestIds: formData.getAll('guest_ids').map(String),
        defaultDurationSeconds: Number(formData.get('default_duration_seconds') || 30),
        status: String(formData.get('status') || 'ready'),
    });

    if (!result.success) {
        throw new Error(result.error);
    }

    revalidatePlates();
}

export async function archiveGuestLineupPlateAction(formData: FormData) {
    const result = await archiveGuestPlate(String(formData.get('slide_id')));

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
