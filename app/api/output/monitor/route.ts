import { NextResponse } from 'next/server';

import { requireAdmin } from '@/lib/auth/auth';
import { buildSignageMonitorPayload } from '@/lib/output/screen-monitor';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        await requireAdmin();
        const payload = await buildSignageMonitorPayload();

        return NextResponse.json(payload, { headers: { 'Cache-Control': 'no-store' } });
    } catch (error) {
        if (error instanceof Error && error.message === 'Unauthorized') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        const message = error instanceof Error ? error.message : 'Unknown error';

        return NextResponse.json({ error: message }, { status: 500 });
    }
}
