import { appUrl } from '@/lib/helpers/app-url';
import { getAssets, getSlides } from '@/lib/data';
import {
    buildPlaylistCarouselCards,
    getContentPlaylist,
    isPlayableContentPlaylist,
    resolvePlaylistForScreen,
    selectPlaylistCarouselItem,
} from '@/lib/content-playlists';
import { getScreenBySlug } from '@/lib/screens';
import { fallbackState, type ChannelStateBase } from '@/lib/output/fallback-state';
import { secondsSinceMidnightInTimezone } from '@/lib/helpers/time';
import { resolveEmbedMedia } from '@/lib/helpers/embed-url';
import { isYouTubeSlide } from '@/lib/slides/youtube';

import type { MediaAsset, SlideAsset } from '@/lib/types';

export type ScreenStateInputs = {
    screenSlug: string;
    now: Date;
    mediaAccessToken: string;
};

export async function composeScreenState(inputs: ScreenStateInputs) {
    const { screenSlug, now, mediaAccessToken } = inputs;
    const screen = await getScreenBySlug(screenSlug);

    if (!screen || screen.status !== 'active') {
        return {
            ...fallbackState('screen-not-found'),
            screenSlug,
            screenName: screen?.name ?? null,
        };
    }

    const timezone = screen.timezone;
    const base: ChannelStateBase = {
        serverSeconds: secondsSinceMidnightInTimezone(now, timezone),
        generatedAt: now.toISOString(),
        screenOrientation: screen.orientation,
    };
    const resolved = await resolvePlaylistForScreen({
        screenId: screen.id,
        fallbackPlaylistId: screen.fallbackPlaylistId,
        now,
        timezone,
    });

    if (!resolved.playlistId) {
        return {
            ...fallbackState(resolved.reason, base),
            screenSlug: screen.slug,
            screenName: screen.name,
            playlistId: null,
            assignmentId: null,
        };
    }

    const playlist = await getContentPlaylist(resolved.playlistId);

    if (!playlist || !isPlayableContentPlaylist(playlist)) {
        return {
            ...fallbackState('empty-playlist', base),
            screenSlug: screen.slug,
            screenName: screen.name,
            playlistId: resolved.playlistId,
            assignmentId: resolved.assignment?.id ?? null,
        };
    }

    const [mediaAssets, slideAssets] = await Promise.all([getAssets(), getSlides()]);
    const cards = buildPlaylistCarouselCards(playlist.items, mediaAssets, slideAssets);
    const selection = selectPlaylistCarouselItem(
        cards,
        { mediaAssets, slideAssets },
        base.serverSeconds,
        playlist.updatedAt,
    );

    if (!selection) {
        return {
            ...fallbackState('no-playable-items', base),
            screenSlug: screen.slug,
            screenName: screen.name,
            playlistId: playlist.id,
            assignmentId: resolved.assignment?.id ?? null,
        };
    }

    const common = {
        ...base,
        screenSlug: screen.slug,
        screenName: screen.name,
        screenOrientation: screen.orientation,
        playlistId: playlist.id,
        assignmentId: resolved.assignment?.id ?? null,
        reason: resolved.reason,
        blockId: null,
        startOffsetSeconds: selection.elapsedSeconds,
        durationSeconds: selection.card.durationSeconds,
        backgroundMusic: null,
    };

    if (selection.kind === 'slide' && selection.slide) {
        return playlistSlideState(selection.slide, selection, common, mediaAccessToken);
    }

    if (selection.kind === 'asset' && selection.asset) {
        const assetState = await playlistAssetState(
            selection.asset,
            selection,
            common,
            mediaAccessToken,
        );

        if (assetState) {
            return assetState;
        }
    }

    return {
        ...fallbackState('unsupported-playlist-item', base),
        screenSlug: screen.slug,
        screenName: screen.name,
        playlistId: playlist.id,
        assignmentId: resolved.assignment?.id ?? null,
    };
}

function playlistSlideState(
    slide: SlideAsset,
    selection: NonNullable<ReturnType<typeof selectPlaylistCarouselItem>>,
    common: Record<string, unknown>,
    mediaAccessToken: string,
) {
    const renderUrl = appUrl(`/output/slide/${slide.id}`);

    if (mediaAccessToken) {
        renderUrl.searchParams.set('token', mediaAccessToken);
    }

    return {
        ...common,
        kind: 'slide' as const,
        signature: `screen-playlist:${slide.id}:${selection.index}:${slide.updatedAt}:${selection.playlistUpdatedAt}`,
        title: slide.title,
        slideId: slide.id,
        templateId: slide.templateId,
        ...(shouldRenderSlideInIframe(slide) ? { renderUrl: renderUrl.toString() } : {}),
        ...(slide.imageUrl ? { imageUrl: slide.imageUrl } : {}),
        ...(slide.content || slide.htmlContent
            ? { content: slide.content ?? slide.htmlContent ?? '' }
            : {}),
    };
}

async function playlistAssetState(
    asset: MediaAsset,
    selection: NonNullable<ReturnType<typeof selectPlaylistCarouselItem>>,
    common: Record<string, unknown>,
    mediaAccessToken: string,
) {
    const signature = `screen-playlist:${asset.id}:${selection.index}:${asset.updatedAt}:${selection.playlistUpdatedAt}`;

    if (asset.mediaKind === 'image' || asset.sourceType.includes('image')) {
        const imageUrl = asset.url ? withMediaAccessToken(asset.url, mediaAccessToken) : null;

        if (!imageUrl) {
            return null;
        }

        return {
            ...common,
            kind: 'image' as const,
            signature,
            assetId: asset.id,
            title: asset.title,
            imageUrl,
        };
    }

    const presentation = videoPresentation(asset);
    const shared = {
        ...common,
        signature,
        assetId: asset.id,
        title: asset.title,
        muted: false,
        loop: false,
        ...presentation,
    };

    if (asset.sourceType === 'remote_mp4' && asset.url) {
        return {
            ...shared,
            kind: 'mp4' as const,
            url: withMediaAccessToken(asset.url, mediaAccessToken),
        };
    }

    if (asset.sourceType === 'hls' && asset.url) {
        return {
            ...shared,
            kind: 'hls' as const,
            hlsUrl: withMediaAccessToken(asset.url, mediaAccessToken),
        };
    }

    if (asset.sourceType === 'embed' && asset.url) {
        const embed = resolveEmbedMedia(asset.url);

        if (!embed) {
            return null;
        }

        return {
            ...shared,
            kind: 'embed' as const,
            provider: embed.provider,
            embedUrl: embed.embedUrl,
        };
    }

    return null;
}

function shouldRenderSlideInIframe(slide: SlideAsset) {
    return Boolean(slide.templateId) || isYouTubeSlide(slide);
}

function videoPresentation(asset: MediaAsset) {
    const presentation = asset.metadata?.presentation === 'vertical_blur' ? 'vertical_blur' : 'fit';
    const background =
        presentation === 'vertical_blur' || asset.metadata?.background === 'blur'
            ? 'blur'
            : 'black';

    return { presentation, background };
}

function withMediaAccessToken(value: string, token: string) {
    if (!token) {
        return value;
    }

    try {
        const url = new URL(value);

        url.searchParams.set('token', token);

        return url.toString();
    } catch {
        return value;
    }
}
