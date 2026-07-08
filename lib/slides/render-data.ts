import { type SlideTemplateId } from './registry';
import { getWeatherSlideData } from './data/weather';
import type { SlideAsset } from '@/lib/types';
import type { WeatherSlideData } from './types';

export async function getSlideRenderData(templateId: SlideTemplateId, slide?: SlideAsset | null) {
    if (templateId === 'weather') {
        try {
            return { data: await getWeatherSlideData({ slide }) };
        } catch {
            return { data: unavailableWeatherData() };
        }
    }

    return { data: unavailableWeatherData() };
}

function unavailableWeatherData(): WeatherSlideData {
    return {
        available: false,
        locationName: 'Weather',
        temperatureC: null,
        feelsLikeC: null,
        humidityPct: null,
        windKph: null,
        condition: 'Unavailable',
        description: 'Weather data unavailable',
        iconCode: null,
        forecast: [],
        updatedAt: new Date().toISOString(),
        reason: 'weather endpoint unavailable',
    };
}
