import { NextResponse } from 'next/server';

import { requireAdmin } from '@/lib/auth/auth';
import { getScheduleForDate } from '@/lib/data';
import { loadFallbackPolicyStatus } from '@/lib/fallback-policy';
import { analyzeSchedule, withScheduleIssueLinks } from '@/lib/scheduling/schedule-health';

export const dynamic = 'force-dynamic';

export async function GET(_request: Request, { params }: { params: Promise<{ date: string }> }) {
    try {
        await requireAdmin();
        const { date } = await params;
        const schedule = await getScheduleForDate(date);
        const blocks = [...schedule.blocks].sort((a, b) => a.startTimeSeconds - b.startTimeSeconds);
        const fallbackPolicy = await loadFallbackPolicyStatus(schedule);
        const health = analyzeSchedule(schedule, blocks, {
            fallbackPolicyReady: fallbackPolicy.ready,
        });

        return NextResponse.json(
            {
                generatedAt: new Date().toISOString(),
                criticalCount: health.criticalCount,
                warnCount: health.warnCount,
                issues: health.issues.map((issue) => withScheduleIssueLinks(date, issue)),
            },
            { headers: { 'Cache-Control': 'no-store' } },
        );
    } catch (error) {
        if (error instanceof Error && error.message === 'Unauthorized') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        const message = error instanceof Error ? error.message : 'Unknown error';

        return NextResponse.json({ error: message }, { status: 500 });
    }
}
