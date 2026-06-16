import { NextResponse } from 'next/server';

import { requireAdmin } from '@/lib/auth/auth';
import { verifyCsrfToken } from '@/lib/auth/csrf';
import { assertRateLimit, rateLimitErrorResponse } from '@/lib/auth/rate-limit';
import { getPlaylist } from '@/lib/music-playlists';
import { saveMusicPlaylistItems } from '@/lib/mutations/music-playlists';
import { setMusicPlaylistItemsSchema } from '@/lib/schemas/music-playlist';

export const dynamic = 'force-dynamic';

type RouteContext = { params: Promise<{ id: string }> };

export async function PUT(request: Request, context: RouteContext) {
    try {
        await requireAdmin();
        await assertRateLimit({
            scope: 'api:music:playlists',
            request,
            limit: 30,
            windowSeconds: 60,
        });
        await verifyCsrfToken(request);
        const { id } = await context.params;
        const parsed = setMusicPlaylistItemsSchema.safeParse(await request.json());

        if (!parsed.success) {
            return NextResponse.json(
                { error: parsed.error.flatten().formErrors.join(', ') || 'Invalid input' },
                { status: 400 },
            );
        }

        const result = await saveMusicPlaylistItems({
            playlistId: id,
            assetIds: parsed.data.assetIds,
        });

        if (!result.success) {
            return NextResponse.json({ error: result.error }, { status: 400 });
        }

        return NextResponse.json(await getPlaylist(id));
    } catch (error) {
        if (error instanceof Error && error.message === 'Unauthorized') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        if (error instanceof Error && error.message === 'Rate limit exceeded') {
            const { retryAfterSeconds } = rateLimitErrorResponse(error);

            return NextResponse.json(
                { error: 'Rate limit exceeded' },
                { status: 429, headers: { 'Retry-After': String(retryAfterSeconds) } },
            );
        }

        if (error instanceof Error && error.message === 'Invalid CSRF token') {
            return NextResponse.json({ error: 'Invalid CSRF token' }, { status: 403 });
        }

        return NextResponse.json({ error: String(error) }, { status: 500 });
    }
}
