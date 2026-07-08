import { NextResponse } from 'next/server';
import { z } from 'zod';

import { requireAdmin } from '@/lib/auth/auth';
import { searchVimeoAccountVideos } from '@/lib/services/vimeo';
import { getVimeoToken } from '@/lib/settings';

export const dynamic = 'force-dynamic';

const vimeoSearchSchema = z.object({
    query: z.string().trim().min(1, 'Query is required'),
});

export async function GET(request: Request) {
    try {
        await requireAdmin();
        const { searchParams } = new URL(request.url);
        const parsed = vimeoSearchSchema.safeParse({ query: searchParams.get('q') ?? '' });

        if (!parsed.success) {
            return NextResponse.json(
                { error: parsed.error.issues[0]?.message ?? 'Invalid query' },
                { status: 400 },
            );
        }

        const token = await getVimeoToken();

        if (!token) {
            return NextResponse.json({ error: 'Vimeo token not configured' }, { status: 500 });
        }

        const videos = await searchVimeoAccountVideos(token, parsed.data.query);

        return NextResponse.json(
            videos.map((video) => ({
                id: video.uri.split('/').pop() ?? video.uri,
                uri: video.uri,
                title: video.name ?? 'Untitled',
                durationSeconds: video.duration ?? null,
                thumbnailUrl: video.pictures?.sizes?.[0]?.link ?? null,
            })),
            { headers: { 'Cache-Control': 'no-store' } },
        );
    } catch (error) {
        if (error instanceof Error && error.message === 'Unauthorized') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        const message = error instanceof Error ? error.message : 'Unknown error';
        console.error('[api/vimeo/search]', error);

        return NextResponse.json({ error: message }, { status: 500 });
    }
}
