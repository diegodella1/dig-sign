import { describe, expect, it } from 'vitest';
import { getDurationDisplay } from './duration-display';

describe('getDurationDisplay', () => {
    it('returns kind=live when an hls source has no duration', () => {
        expect(getDurationDisplay({ durationSeconds: null, sourceType: 'hls' })).toEqual({
            kind: 'live',
        });
    });

    it('returns numeric duration for embedded video with a known duration', () => {
        expect(getDurationDisplay({ durationSeconds: 30, sourceType: 'embed' })).toEqual({
            kind: 'duration',
            seconds: 30,
        });
    });

    it('falls back to 0 seconds when duration is null and source is not live', () => {
        expect(getDurationDisplay({ durationSeconds: null, sourceType: 'embed' })).toEqual({
            kind: 'duration',
            seconds: 0,
        });
    });

    it('treats an hls source with explicit 0 duration as numeric, not live', () => {
        expect(getDurationDisplay({ durationSeconds: 0, sourceType: 'hls' })).toEqual({
            kind: 'duration',
            seconds: 0,
        });
    });
});
