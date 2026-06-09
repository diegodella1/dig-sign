import { redirect } from 'next/navigation';

import { programSubNavForDate } from '@/components/broadcast/mode-sub-nav-items';
import { FlowLinkList } from '@/components/admin/admin-flow';
import { AdminShell } from '@/components/admin/admin-shell';
import { ProgramActivatePanel } from '@/components/program/program-activate-panel';
import { getDays, getScheduleForDate } from '@/lib/data';
import { loadFallbackPolicyStatus } from '@/lib/fallback-policy';
import { updateProgramDayStatus } from '@/lib/mutations';
import { analyzeSchedule } from '@/lib/scheduling/schedule-health';
import { isoDateInTimezone, PLAYOUT_TIMEZONE } from '@/lib/helpers/time';

export const dynamic = 'force-dynamic';

export default async function ProgramPage() {
    const today = isoDateInTimezone(new Date(), PLAYOUT_TIMEZONE);
    const [days, schedule, fallbackPolicy] = await Promise.all([
        getDays(),
        getScheduleForDate(today),
        loadFallbackPolicyStatus(),
    ]);
    const blocks = [...schedule.blocks].sort((a, b) => a.startTimeSeconds - b.startTimeSeconds);
    const health = analyzeSchedule(schedule, blocks, {
        fallbackPolicyReady: fallbackPolicy.ready,
    });
    const fallbackLabel = fallbackPolicy.label;
    const gapFillTone = fallbackPolicy.ready ? undefined : ('warn' as const);
    const dayStatus = schedule.day?.status ?? 'missing';

    async function activateDay(formData: FormData) {
        'use server';
        const result = await updateProgramDayStatus({
            date: today,
            status: 'active',
            allowWarnings: formData.get('allow_warnings') === 'on',
        });

        if (!result.success) {
            redirect(`/admin/program?error=${encodeURIComponent(result.error)}`);
        }

        redirect('/admin/operate');
    }

    async function markDayReady() {
        'use server';
        const result = await updateProgramDayStatus({
            date: today,
            status: 'ready',
            allowWarnings: true,
        });

        if (!result.success) {
            redirect(`/admin/program?error=${encodeURIComponent(result.error)}`);
        }

        redirect('/admin/program');
    }

    return (
        <AdminShell title="Program" subNav={programSubNavForDate(today)}>
            <ProgramActivatePanel
                today={today}
                dayStatus={dayStatus}
                hasDay={Boolean(schedule.day)}
                criticalCount={health.criticalCount}
                warnCount={health.warnCount}
                activateAction={activateDay}
                setReadyAction={markDayReady}
            />
            <FlowLinkList
                items={[
                    { href: '/admin/calendar', label: 'Calendar', badge: `${days.length} days` },
                    {
                        href: `/admin/schedule/${today}`,
                        label: "Today's rundown",
                        badge: `${blocks.length} blocks`,
                        ...(health.criticalCount ? { tone: 'warn' as const } : {}),
                    },
                    {
                        href: `/admin/schedule/${today}#bulk-cards`,
                        label: 'Fill range with plates',
                    },
                    {
                        href: '/admin/program/fallback',
                        label: 'Fallback policy',
                        badge: fallbackLabel,
                        ...(gapFillTone ? { tone: gapFillTone } : {}),
                    },
                ]}
            />
        </AdminShell>
    );
}
