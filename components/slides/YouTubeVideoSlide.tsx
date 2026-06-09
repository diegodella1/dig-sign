'use client';

import { useEffect, useState } from 'react';

import { getYouTubeSlideConfig, youTubeEmbedUrl } from '@/lib/slides/youtube';

import type { SlideAsset } from '@/lib/types';

const START_REVEAL_MS = 4_500;

type YouTubeVideoSlideProps = {
    slide: SlideAsset;
};

export function YouTubeVideoSlide({ slide }: YouTubeVideoSlideProps) {
    const config = getYouTubeSlideConfig(slide);
    const [revealed, setRevealed] = useState(false);

    useEffect(() => {
        setRevealed(false);
        const revealTimer = setTimeout(() => setRevealed(true), START_REVEAL_MS);

        return () => clearTimeout(revealTimer);
    }, [slide.id]);

    if (!config) {
        return (
            <section className="grid h-screen w-screen place-items-center bg-black text-white">
                <p className="text-3xl font-semibold">YouTube video unavailable</p>
            </section>
        );
    }

    const zoomClass = config.zoom === 1.25 ? 'scale-125' : 'scale-100';
    const hiddenZoomClass = config.zoom === 1.25 ? 'scale-[1.3]' : 'scale-[1.04]';

    return (
        <section className="relative h-screen w-screen overflow-hidden bg-black">
            <iframe
                className={[
                    'absolute inset-0 h-full w-full origin-center border-0 bg-black transition-[filter,transform] duration-[4500ms] ease-out',
                    revealed ? `${zoomClass} blur-0` : `${hiddenZoomClass} blur-xl`,
                ].join(' ')}
                src={youTubeEmbedUrl(config)}
                title={slide.title}
                allow="autoplay; encrypted-media; picture-in-picture"
                referrerPolicy="strict-origin-when-cross-origin"
            />
            {!revealed ? (
                <div
                    data-testid="youtube-video-start-mask"
                    className="pointer-events-none absolute inset-0 bg-black/70 transition-opacity duration-[4500ms] ease-out"
                />
            ) : null}
        </section>
    );
}
