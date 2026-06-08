'use client';

import { useEffect, useRef, useState } from 'react';

export const BACKGROUND_PLAY_TIMEOUT_MS = 12_000;
export const BACKGROUND_START_REVEAL_MS = 4_500;

const YT_SCRIPT_SRC = 'https://www.youtube.com/iframe_api';

type YouTubePlayerInstance = {
    mute: () => void;
    playVideo: () => void;
    destroy: () => void;
};

type YouTubePlayerConstructor = new (
    element: HTMLElement,
    options: Record<string, unknown>,
) => YouTubePlayerInstance;

type YouTubeNamespace = {
    Player: YouTubePlayerConstructor;
    PlayerState: {
        PLAYING: number;
        ENDED: number;
    };
};

declare global {
    interface Window {
        YT?: YouTubeNamespace;
        onYouTubeIframeAPIReady?: () => void;
    }
}

let ytApiPromise: Promise<void> | null = null;

function loadYouTubeIframeApi() {
    if (typeof window === 'undefined') {
        return Promise.resolve();
    }

    if (window.YT?.Player) {
        return Promise.resolve();
    }

    if (ytApiPromise) {
        return ytApiPromise;
    }

    ytApiPromise = new Promise((resolve) => {
        const previousReady = window.onYouTubeIframeAPIReady;

        window.onYouTubeIframeAPIReady = () => {
            previousReady?.();
            resolve();
        };

        if (!document.querySelector(`script[src="${YT_SCRIPT_SRC}"]`)) {
            const script = document.createElement('script');
            script.src = YT_SCRIPT_SRC;
            document.head.appendChild(script);
        }
    });

    return ytApiPromise;
}

type YouTubeBackgroundPlayerProps = {
    videoId: string;
    onFailed: () => void;
};

export function YouTubeBackgroundPlayer({ videoId, onFailed }: YouTubeBackgroundPlayerProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const playerRef = useRef<YouTubePlayerInstance | null>(null);
    const failedRef = useRef(false);
    const onFailedRef = useRef(onFailed);
    const [revealed, setRevealed] = useState(false);

    useEffect(() => {
        onFailedRef.current = onFailed;
    }, [onFailed]);

    useEffect(() => {
        setRevealed(false);
        const revealTimer = setTimeout(() => setRevealed(true), BACKGROUND_START_REVEAL_MS);

        return () => clearTimeout(revealTimer);
    }, [videoId]);

    useEffect(() => {
        failedRef.current = false;
        let playTimer: ReturnType<typeof setTimeout> | null = null;
        let cancelled = false;

        const reportFailed = () => {
            if (failedRef.current || cancelled) {
                return;
            }

            failedRef.current = true;
            onFailedRef.current();
        };

        async function init() {
            await loadYouTubeIframeApi();

            if (cancelled || !containerRef.current || !window.YT?.Player) {
                reportFailed();

                return;
            }

            playTimer = setTimeout(reportFailed, BACKGROUND_PLAY_TIMEOUT_MS);

            playerRef.current = new window.YT.Player(containerRef.current, {
                videoId,
                host: 'https://www.youtube-nocookie.com',
                width: '100%',
                height: '100%',
                playerVars: {
                    autoplay: 1,
                    cc_load_policy: 0,
                    controls: 0,
                    disablekb: 1,
                    enablejsapi: 1,
                    fs: 0,
                    iv_load_policy: 3,
                    modestbranding: 1,
                    mute: 1,
                    playsinline: 1,
                    rel: 0,
                    origin: window.location.origin,
                },
                events: {
                    onReady: (event: { target: YouTubePlayerInstance }) => {
                        event.target.mute();
                        event.target.playVideo();
                    },
                    onError: () => {
                        if (playTimer) {
                            clearTimeout(playTimer);
                        }

                        reportFailed();
                    },
                    onStateChange: (event: { data: number }) => {
                        if (event.data === window.YT?.PlayerState.PLAYING && playTimer) {
                            clearTimeout(playTimer);
                        }

                        if (event.data === window.YT?.PlayerState.ENDED) {
                            if (playTimer) {
                                clearTimeout(playTimer);
                            }

                            reportFailed();
                        }
                    },
                },
            });
        }

        void init();

        return () => {
            cancelled = true;

            if (playTimer) {
                clearTimeout(playTimer);
            }

            playerRef.current?.destroy();
            playerRef.current = null;
        };
    }, [videoId]);

    return (
        <div
            className="pointer-events-none absolute inset-0 overflow-hidden bg-black"
            aria-hidden="true"
            data-testid="youtube-background-player"
        >
            <div
                className={[
                    'absolute inset-0 origin-center transition-[filter,transform] duration-[4500ms] ease-out',
                    revealed ? 'scale-125 blur-0' : 'scale-[1.3] blur-xl',
                ].join(' ')}
            >
                <div ref={containerRef} className="h-full w-full" />
            </div>
            {!revealed ? (
                <div
                    data-testid="youtube-background-start-mask"
                    className="pointer-events-none absolute inset-0 bg-black/70 transition-opacity duration-[4500ms] ease-out"
                />
            ) : null}
        </div>
    );
}
