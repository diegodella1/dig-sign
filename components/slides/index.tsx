'use client';

import { WeatherSlide, type WeatherSlideProps } from './WeatherSlide';

import type { SlideTemplateId } from '@/lib/slides/registry';

export type SlideTemplateRendererProps = {
    templateId: SlideTemplateId;
    data: unknown;
};

export function SlideTemplateRenderer({ templateId, data }: SlideTemplateRendererProps) {
    switch (templateId) {
        case 'weather':
            return <WeatherSlide {...(data as WeatherSlideProps)} />;
    }
}
