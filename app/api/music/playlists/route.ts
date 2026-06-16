import { NextResponse } from 'next/server';

import { requireAdmin } from '@/lib/auth/auth';
import { verifyCsrfToken } from '@/lib/auth/csrf';
import { assertRateLimit, rateLimitErrorResponse } from '@/lib/auth/rate-limit';
import { listPlaylists } from '@/lib/music-playlists';
import { createMusicPlaylist } from '@/lib/mutations/music-playlists';
import { createMusicPlaylistSchema } from '@/lib/schemas/music-playlist';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        await requireAdmin();

        return NextResponse.json(await listPlaylists(), {
            headers: { 'Cache-Control': 'no-store' },
        });
    } catch (error) {
        if (error instanceof Error && error.message === 'Unauthorized') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        return NextResponse.json({ error: String(error) }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        await requireAdmin();
        await assertRateLimit({
            scope: 'api:music:playlists',
            request,
            limit: 30,
            windowSeconds: 60,
        });
        await verifyCsrfToken(request);
        const parsed = createMusicPlaylistSchema.safeParse(await request.json());

        if (!parsed.success) {
            return NextResponse.json(
                { error: parsed.error.flatten().formErrors.join(', ') || 'Invalid input' },
                { status: 400 },
            );
        }

        const result = await createMusicPlaylist({
            name: parsed.data.name,
            ...(parsed.data.status ? { status: parsed.data.status } : {}),
        });

        if (!result.success) {
            return NextResponse.json({ error: result.error }, { status: 400 });
        }

        return NextResponse.json(result.data, { status: 201 });
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
