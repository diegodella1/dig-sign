import { NextResponse } from 'next/server';

import { fallbackState } from '@/lib/output/fallback-state';
import { composeScreenState } from '@/lib/output/screen-state';
import { isOutputRequestAllowed, outputAccessDeniedReason } from '@/lib/auth/output-auth';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const allowed = await isOutputRequestAllowed({
            token: searchParams.get('token') ?? undefined,
        });

        if (!allowed) {
            return NextResponse.json({ error: outputAccessDeniedReason() }, { status: 401 });
        }
        const mediaAccessToken =
            searchParams.get('token') ?? process.env.OUTPUT_CAPTURE_TOKEN ?? '';
        const screenSlug = searchParams.get('screen')?.trim() || 'main';
        const state = await composeScreenState({
            screenSlug,
            now: new Date(),
            mediaAccessToken,
        });

        return NextResponse.json(state, {
            headers: { 'Cache-Control': 'public, max-age=1, stale-while-revalidate=2' },
        });
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';

        return NextResponse.json(
            { ...fallbackState('state-error'), error: message },
            { status: 200 },
        );
    }
}
