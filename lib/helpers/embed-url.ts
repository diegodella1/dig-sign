export type EmbedMediaProvider = 'youtube' | 'vimeo';

export type EmbedMedia = {
    provider: EmbedMediaProvider;
    embedUrl: string;
};

export function resolveEmbedMedia(value: string): EmbedMedia | null {
    const input = value.trim();

    if (!input) {
        return null;
    }

    const youtubeId = parseYouTubeId(input);

    if (youtubeId) {
        return {
            provider: 'youtube',
            embedUrl: youtubeEmbedUrl(youtubeId),
        };
    }

    const vimeoId = parseVimeoId(input);

    if (vimeoId) {
        return {
            provider: 'vimeo',
            embedUrl: vimeoEmbedUrl(vimeoId),
        };
    }

    return null;
}

function parseYouTubeId(value: string) {
    try {
        const url = new URL(value);
        const host = url.hostname.replace(/^www\./, '');

        if (host === 'youtu.be') {
            return safeYouTubeId(url.pathname.slice(1).split('/')[0] ?? '');
        }

        if (host === 'youtube.com' || host === 'm.youtube.com' || host === 'music.youtube.com') {
            if (url.pathname.startsWith('/embed/')) {
                return safeYouTubeId(url.pathname.split('/')[2] ?? '');
            }

            if (url.pathname.startsWith('/shorts/')) {
                return safeYouTubeId(url.pathname.split('/')[2] ?? '');
            }

            return safeYouTubeId(url.searchParams.get('v') ?? '');
        }
    } catch {
        return null;
    }

    return null;
}

function parseVimeoId(value: string) {
    try {
        const url = new URL(value);
        const host = url.hostname.replace(/^www\./, '');

        if (host === 'player.vimeo.com' && url.pathname.startsWith('/video/')) {
            return safeVimeoId(url.pathname.split('/')[2] ?? '');
        }

        if (host === 'vimeo.com') {
            const parts = url.pathname.split('/').filter(Boolean);
            const candidate = [...parts].reverse().find((part) => /^\d+$/.test(part));

            return safeVimeoId(candidate ?? '');
        }
    } catch {
        return null;
    }

    return null;
}

function safeYouTubeId(value: string) {
    return /^[a-zA-Z0-9_-]{6,}$/.test(value) ? value : null;
}

function safeVimeoId(value: string) {
    return /^\d{5,}$/.test(value) ? value : null;
}

function youtubeEmbedUrl(id: string) {
    const url = new URL(`https://www.youtube-nocookie.com/embed/${id}`);
    url.searchParams.set('autoplay', '1');
    url.searchParams.set('playsinline', '1');
    url.searchParams.set('rel', '0');
    url.searchParams.set('modestbranding', '1');

    return url.toString();
}

function vimeoEmbedUrl(id: string) {
    const url = new URL(`https://player.vimeo.com/video/${id}`);
    url.searchParams.set('autoplay', '1');
    url.searchParams.set('playsinline', '1');

    return url.toString();
}
