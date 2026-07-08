import { beforeEach, describe, expect, it, vi } from 'vitest';

import { GET } from './route';

vi.mock('@/lib/output/screen-state', () => ({
    composeScreenState: vi.fn(async () => ({
        kind: 'slide',
        signature: 'slide:test',
        title: 'Test slide',
        serverSeconds: 0,
        generatedAt: new Date().toISOString(),
        backgroundMusic: null,
    })),
}));

vi.mock('@/lib/auth/output-auth', () => ({
    isOutputRequestAllowed: vi.fn(async () => true),
    outputAccessDeniedReason: vi.fn(() => 'denied'),
}));

describe('GET /api/output/channel/state', () => {
    beforeEach(() => {
        vi.resetAllMocks();
    });

    it('returns screen state for the requested screen slug', async () => {
        const response = await GET(
            new Request('http://localhost/api/output/channel/state?screen=lobby&token=test'),
        );
        const payload = await response.json();

        expect(response.status).toBe(200);
        expect(payload.kind).toBe('slide');
        expect(payload.title).toBe('Test slide');
    });

    it('returns fallback payload when composition fails', async () => {
        const { composeScreenState } = await import('@/lib/output/screen-state');
        vi.mocked(composeScreenState).mockRejectedValueOnce(new Error('boom'));

        const response = await GET(new Request('http://localhost/api/output/channel/state'));
        const payload = await response.json();

        expect(response.status).toBe(200);
        expect(payload.kind).toBe('fallback');
        expect(payload.error).toBe('boom');
    });
});
