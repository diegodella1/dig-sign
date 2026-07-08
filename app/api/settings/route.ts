import { NextResponse } from 'next/server';

import { requireAdmin } from '@/lib/auth/auth';

export async function POST() {
    await requireAdmin();

    return NextResponse.json(
        { ok: false, error: 'Integration settings API is no longer available.' },
        { status: 410 },
    );
}
