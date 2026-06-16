import { NextResponse } from 'next/server';

import { requireAdmin } from '@/lib/auth/auth';
import { verifyCsrfToken } from '@/lib/auth/csrf';
import { assertRateLimit, rateLimitErrorResponse } from '@/lib/auth/rate-limit';
import { getMusicOutputSettings } from '@/lib/music-playlists';
import { saveMusicOutputConfig } from '@/lib/mutations/music-playlists';
import { musicOutputSettingsSchema } from '@/lib/schemas/music-playlist';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        await requireAdmin();

        return NextResponse.json(await getMusicOutputSettings(), {
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
            scope: 'api:music:output-settings',
            request,
            limit: 30,
            windowSeconds: 60,
        });
        await verifyCsrfToken(request);
        const parsed = musicOutputSettingsSchema.safeParse(await request.json());

        if (!parsed.success) {
            return NextResponse.json(
                { error: parsed.error.flatten().formErrors.join(', ') || 'Invalid input' },
                { status: 400 },
            );
        }

        const result = await saveMusicOutputConfig(parsed.data as Record<string, unknown>);

        if (!result.success) {
            return NextResponse.json({ error: result.error }, { status: 400 });
        }

        return NextResponse.json(result.data, { headers: { 'Cache-Control': 'no-store' } });
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
