/**
 * Domain types shared across slide components.
 */

export type WeatherForecastPoint = {
    label: string;
    temperatureC: number | null;
    condition: string;
    precipitationProbability: number | null;
};

export type WeatherSlideData = {
    available: boolean;
    locationName: string;
    temperatureC: number | null;
    feelsLikeC: number | null;
    humidityPct: number | null;
    windKph: number | null;
    condition: string;
    description: string;
    iconCode: string | null;
    forecast: WeatherForecastPoint[];
    updatedAt: string;
    reason?: string;
    backgroundVideo?: { videoId: string } | null;
};
