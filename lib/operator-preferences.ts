import {
    getMusicOutputSettings,
    saveMusicOutputSettings,
    type MusicOutputSettings,
} from './music-playlists';

export type MusicPreference = {
    enabled: boolean;
    volume: number;
    fade: 'none' | 'short';
};

const DEFAULT_MUSIC_PREFERENCE: MusicPreference = {
    enabled: false,
    volume: 50,
    fade: 'short',
};

export async function getMusicPreference(): Promise<MusicPreference> {
    const settings = await getMusicOutputSettings();

    return toMusicPreference(settings);
}

export async function getLatestMusicPreference(): Promise<MusicPreference> {
    return getMusicPreference();
}

export async function saveMusicPreference(
    input: Partial<MusicPreference>,
): Promise<MusicPreference> {
    const current = await getMusicOutputSettings();
    const next = await saveMusicOutputSettings({
        ...current,
        ...parseMusicPreference(input),
    });

    return toMusicPreference(next);
}

function toMusicPreference(settings: MusicOutputSettings): MusicPreference {
    return {
        enabled: settings.enabled,
        volume: settings.volume,
        fade: settings.fade,
    };
}

function parseMusicPreference(value: unknown): MusicPreference {
    const source =
        typeof value === 'object' && value !== null ? (value as Record<string, unknown>) : {};
    const volume = Number(source.volume);

    return {
        enabled: source.enabled === true,
        volume: Number.isFinite(volume) ? Math.max(0, Math.min(100, Math.round(volume))) : 50,
        fade: source.fade === 'none' ? 'none' : 'short',
    };
}

export { DEFAULT_MUSIC_PREFERENCE };
