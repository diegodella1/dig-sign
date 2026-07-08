import { render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { OutputMonitorPanel } from './output-monitor-panel';

import type { SignageMonitorPayload } from '@/components/broadcast/types';

describe('OutputMonitorPanel', () => {
    beforeEach(() => {
        vi.useFakeTimers({ shouldAdvanceTime: true });
        global.fetch = vi.fn(async () => jsonResponse(initialPayload));
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('shows screen output guidance and refreshes diagnostics', async () => {
        render(<OutputMonitorPanel initial={initialPayload} />);

        expect(screen.getByText('Screen output')).toBeInTheDocument();
        expect(screen.getByText(/\/output\/live\/\[screen\]/)).toBeInTheDocument();

        await waitFor(() =>
            expect(global.fetch).toHaveBeenCalledWith('/api/output/monitor', { cache: 'no-store' }),
        );
    });
});

function jsonResponse(payload: unknown) {
    return new Response(JSON.stringify(payload), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
    });
}

const initialPayload: SignageMonitorPayload = {
    generatedAt: '2026-05-15T14:30:00Z',
    screens: [
        {
            slug: 'main',
            name: 'Main',
            timezone: 'America/Argentina/Buenos_Aires',
            serverSeconds: 27000,
            playlistId: 'playlist-1',
            playlistName: 'Lobby loop',
            assignmentId: null,
            reason: 'assigned-playlist',
            outputKind: 'slide',
            title: 'Weather',
            durationSeconds: 30,
            elapsedSeconds: 5,
            mediaError: null,
        },
    ],
};
