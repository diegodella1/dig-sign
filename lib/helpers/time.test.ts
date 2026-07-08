import { describe, expect, it } from 'vitest';

import {
    PLAYOUT_TIMEZONE,
    formatClockInTimezone,
    formatTimeZoneHelp,
    isoDateInTimezone,
    secondsSinceMidnightInTimezone,
    zonedTimeToUtc,
} from './time';

describe('playout timezone', () => {
    it('uses Buenos Aires as playout timezone', () => {
        expect(PLAYOUT_TIMEZONE).toBe('America/Argentina/Buenos_Aires');
    });

    it('gets seconds since Buenos Aires midnight', () => {
        const date = new Date('2026-05-08T22:30:15.000Z');
        expect(isoDateInTimezone(date, PLAYOUT_TIMEZONE)).toBe('2026-05-08');
        expect(secondsSinceMidnightInTimezone(date, PLAYOUT_TIMEZONE)).toBe(
            19 * 3600 + 30 * 60 + 15,
        );
    });

    it('converts a scheduled Buenos Aires clock time to helper zones', () => {
        const instant = zonedTimeToUtc('2026-05-08', 15 * 3600, PLAYOUT_TIMEZONE);
        expect(formatClockInTimezone(instant, 'Europe/London')).toBe('19:00');
        expect(formatClockInTimezone(instant, 'America/Los_Angeles')).toBe('11:00');
        expect(formatClockInTimezone(instant, 'Asia/Hong_Kong')).toBe('02:00');
    });

    it('formats helper tooltip text', () => {
        expect(formatTimeZoneHelp('2026-05-08', 15 * 3600)).toContain('15:00:00 BA');
        expect(formatTimeZoneHelp('2026-05-08', 15 * 3600)).toContain('Los Angeles: 11:00');
    });
});
