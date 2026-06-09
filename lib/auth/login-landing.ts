import { getLiveSchedule } from '@/lib/data';
import { findActiveSchedule } from '@/lib/scheduling/scheduler';
import { PLAYOUT_TIMEZONE, secondsSinceMidnightInTimezone } from '@/lib/helpers/time';

/** Prefer Operate when today's program day is active and a return path is generic. */
export async function resolveAdminLoginLanding(returnTo: string): Promise<string> {
    if (returnTo !== '/admin' && returnTo !== '/admin/') {
        return returnTo;
    }

    try {
        const schedule = await getLiveSchedule();
        const timezone = schedule.day?.timezone ?? PLAYOUT_TIMEZONE;
        const nowSeconds = secondsSinceMidnightInTimezone(new Date(), timezone);
        const active = findActiveSchedule(schedule, nowSeconds);

        if (schedule.day?.status === 'active') {
            return '/admin/operate';
        }

        if (active.block) {
            return '/admin/operate';
        }
    } catch {
        return returnTo;
    }

    return returnTo;
}
