import { SLIDE_TEMPLATES, type SlideTemplateId } from '@/lib/slides/registry';
import { isYouTubeSlide } from '@/lib/slides/youtube';

import type { SlideAsset } from '@/lib/types';

export type PlateTab = 'all' | 'weather' | 'youtube' | 'custom';

const DEPRECATED_TEMPLATE_IDS = new Set(['news', 'show', 'video', 'guest-lineup']);

export function parsePlateTab(value: string | undefined): PlateTab {
    if (value === 'weather' || value === 'youtube' || value === 'custom') {
        return value;
    }

    return 'all';
}

export function plateCategory(slide: SlideAsset): PlateTab {
    if (slide.templateId === 'weather') {
        return 'weather';
    }

    if (isYouTubeSlide(slide)) {
        return 'youtube';
    }

    return 'custom';
}

export function plateTypeLabel(slide: SlideAsset) {
    if (slide.templateId === 'weather') {
        return 'Weather';
    }

    if (isYouTubeSlide(slide)) {
        return 'YouTube';
    }

    if (slide.templateId) {
        const template = SLIDE_TEMPLATES.find((entry) => entry.id === slide.templateId);

        return template?.label ?? slide.templateId;
    }

    return 'Custom';
}

export function filterPlatesByTab(slides: SlideAsset[], tab: PlateTab) {
    const active = slides.filter((slide) => slide.status !== 'archived');

    if (tab === 'all') {
        return active.sort((a, b) => a.title.localeCompare(b.title));
    }

    return active
        .filter((slide) => plateCategory(slide) === tab)
        .sort((a, b) => a.title.localeCompare(b.title));
}

export function isLegacyPlate(slide: SlideAsset) {
    const currentIds = new Set<SlideTemplateId>(SLIDE_TEMPLATES.map((template) => template.id));

    if (slide.templateId) {
        const templateId = slide.templateId as SlideTemplateId;

        return !currentIds.has(templateId) || DEPRECATED_TEMPLATE_IDS.has(templateId);
    }

    return false;
}

export function weatherDefaults(slide?: SlideAsset) {
    const youtubeUrl =
        typeof slide?.metadata?.youtubeUrl === 'string' ? slide.metadata.youtubeUrl.trim() : '';

    return {
        locationName: stringMeta(slide?.metadata?.weatherLocationName, 'Buenos Aires'),
        lat: numberMeta(slide?.metadata?.weatherLat, -34.6037),
        lon: numberMeta(slide?.metadata?.weatherLon, -58.3816),
        youtubeUrl,
    };
}

export function guestIdsFromMetadata(metadata: SlideAsset['metadata']) {
    if (!metadata || typeof metadata !== 'object' || Array.isArray(metadata)) {
        return [];
    }

    const guestIds = (metadata as Record<string, unknown>).guestIds;

    return Array.isArray(guestIds) ? guestIds.map(String) : [];
}

function stringMeta(value: unknown, fallback: string) {
    return typeof value === 'string' && value.trim() ? value : fallback;
}

function numberMeta(value: unknown, fallback: number) {
    const parsed = Number(value);

    return Number.isFinite(parsed) ? parsed : fallback;
}

export const SYSTEM_SLIDE_PRESETS = SLIDE_TEMPLATES.filter(
    (template) => template.id !== 'weather',
).map((template) => ({
    title: `${template.label} plate`,
    templateId: template.id,
    content: `System slide: ${template.label}. Uses live data when available and safe fallback data otherwise.`,
}));
