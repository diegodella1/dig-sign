import { redirect } from 'next/navigation';

import { programSubNavForDate } from '@/components/broadcast/mode-sub-nav-items';
import { FlowLinkList } from '@/components/admin/admin-flow';
import { AdminShell } from '@/components/admin/admin-shell';
import { ProgramActivatePanel } from '@/components/program/program-activate-panel';
import { getDays, getScheduleForDate } from '@/lib/data';
import { fallbackCarouselDisplayName, getGlobalFallbackCarousel } from '@/lib/fallback-carousel';
import { updateProgramDayStatus } from '@/lib/mutations';
import { findFallbackCandidate } from '@/lib/scheduling/fallback';
import { analyzeSchedule } from '@/lib/scheduling/schedule-health';
import { isoDateInTimezone, PLAYOUT_TIMEZONE } from '@/lib/helpers/time';

export const dynamic = 'force-dynamic';

export default async function ProgramPage() {
    const today = isoDateInTimezone(new Date(), PLAYOUT_TIMEZONE);
    const [days, schedule, fallbackCarousel] = await Promise.all([
        getDays(),
        getScheduleForDate(today),
        getGlobalFallbackCarousel(),
    ]);
    const blocks = [...schedule.blocks].sort((a, b) => a.startTimeSeconds - b.startTimeSeconds);
    const health = analyzeSchedule(schedule, blocks);
    const fallbackVideo = findFallbackCandidate(schedule.mediaAssets);
    const fallbackLabel =
        fallbackCarouselDisplayName(fallbackCarousel) ?? fallbackVideo?.title ?? 'Not set';
    const gapFillTone = fallbackVideo || fallbackCarousel?.enabled ? undefined : ('warn' as const);
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
                        label: 'Loop builder',
                    },
                    {
                        href: '/admin/prepare/gap-fill',
                        label: 'Gap fill',
                        badge: fallbackLabel,
                        ...(gapFillTone ? { tone: gapFillTone } : {}),
                    },
                ]}
            />
        </AdminShell>
    );
}
