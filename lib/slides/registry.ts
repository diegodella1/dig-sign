export type SlideTemplateId = 'weather';

export type SlideTemplateEntry = {
    readonly id: SlideTemplateId;
    readonly label: string;
    readonly description: string;
    readonly dataEndpoint: string | null;
};

export const SLIDE_TEMPLATES: ReadonlyArray<SlideTemplateEntry> = [
    {
        id: 'weather',
        label: 'Weather',
        description: 'Current conditions and forecast from OpenWeather',
        dataEndpoint: '/api/slide-data/weather',
    },
] as const;
