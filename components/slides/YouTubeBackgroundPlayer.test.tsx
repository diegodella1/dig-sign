import { act, render } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
    BACKGROUND_PLAY_TIMEOUT_MS,
    YouTubeBackgroundPlayer,
} from './YouTubeBackgroundPlayer';

describe('YouTubeBackgroundPlayer', () => {
    beforeEach(() => {
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.useRealTimers();
        delete window.YT;
        delete window.onYouTubeIframeAPIReady;
        document.querySelectorAll('script[src="https://www.youtube.com/iframe_api"]').forEach(
            (node) => node.remove(),
        );
    });

    it('calls onFailed when the player reports an error', async () => {
        const onFailed = vi.fn();
        let capturedEvents: Record<string, (event: { data?: number; target?: unknown }) => void> =
            {};

        class MockPlayer {
            mute = vi.fn();
            playVideo = vi.fn();
            destroy = vi.fn();

            constructor(_element: HTMLElement, options: Record<string, unknown>) {
                void _element;
                capturedEvents = options.events as typeof capturedEvents;
            }
        }

        window.YT = {
            Player: MockPlayer as unknown as typeof window.YT.Player,
            PlayerState: {
                PLAYING: 1,
                ENDED: 0,
            },
        };

        render(<YouTubeBackgroundPlayer videoId="dQw4w9WgXcQ" onFailed={onFailed} />);

        await act(async () => {
            window.onYouTubeIframeAPIReady?.();
            await Promise.resolve();
        });

        await act(async () => {
            capturedEvents.onError?.({});
        });

        expect(onFailed).toHaveBeenCalledTimes(1);
    });

    it('calls onFailed when playback never starts', async () => {
        const onFailed = vi.fn();

        class MockPlayer {
            mute = vi.fn();
            playVideo = vi.fn();
            destroy = vi.fn();

            constructor(element: HTMLElement, options: Record<string, unknown>) {
                void element;
                void options;
            }
        }

        window.YT = {
            Player: MockPlayer as unknown as typeof window.YT.Player,
            PlayerState: {
                PLAYING: 1,
                ENDED: 0,
            },
        };

        render(<YouTubeBackgroundPlayer videoId="dQw4w9WgXcQ" onFailed={onFailed} />);

        await act(async () => {
            window.onYouTubeIframeAPIReady?.();
            await Promise.resolve();
        });

        await act(async () => {
            vi.advanceTimersByTime(BACKGROUND_PLAY_TIMEOUT_MS + 100);
        });

        expect(onFailed).toHaveBeenCalledTimes(1);
    });
});
