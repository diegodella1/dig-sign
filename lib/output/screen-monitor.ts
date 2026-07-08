import { getContentPlaylist, resolvePlaylistForScreen } from '@/lib/content-playlists';
import { composeScreenState } from '@/lib/output/screen-state';
import { listScreens } from '@/lib/screens';
import { secondsSinceMidnightInTimezone } from '@/lib/helpers/time';

export type ScreenMonitorSnapshot = {
    slug: string;
    name: string;
    timezone: string;
    serverSeconds: number;
    playlistId: string | null;
    playlistName: string | null;
    assignmentId: string | null;
    reason: string | null;
    outputKind: string;
    title: string;
    durationSeconds: number | null;
    elapsedSeconds: number | null;
    mediaError: string | null;
};

export type SignageMonitorPayload = {
    generatedAt: string;
    screens: ScreenMonitorSnapshot[];
};

export async function buildSignageMonitorPayload(now = new Date()): Promise<SignageMonitorPayload> {
    const screens = await listScreens();
    const snapshots = await Promise.all(
        screens.map(async (screen) => snapshotForScreen(screen, now)),
    );

    return {
        generatedAt: now.toISOString(),
        screens: snapshots,
    };
}

async function snapshotForScreen(
    screen: Awaited<ReturnType<typeof listScreens>>[number],
    now: Date,
): Promise<ScreenMonitorSnapshot> {
    const timezone = screen.timezone;
    const serverSeconds = secondsSinceMidnightInTimezone(now, timezone);
    const resolved = await resolvePlaylistForScreen({
        screenId: screen.id,
        fallbackPlaylistId: screen.fallbackPlaylistId,
        now,
        timezone,
    });
    const playlist = resolved.playlistId ? await getContentPlaylist(resolved.playlistId) : null;
    const state = await composeScreenState({
        screenSlug: screen.slug,
        now,
        mediaAccessToken: '',
    });
    const stateRecord = state as Record<string, unknown>;
    const durationSeconds =
        typeof stateRecord.durationSeconds === 'number' ? stateRecord.durationSeconds : null;
    const elapsedSeconds =
        typeof stateRecord.startOffsetSeconds === 'number'
            ? stateRecord.startOffsetSeconds
            : null;

    return {
        slug: screen.slug,
        name: screen.name,
        timezone,
        serverSeconds,
        playlistId: resolved.playlistId,
        playlistName: playlist?.name ?? null,
        assignmentId: resolved.assignment?.id ?? null,
        reason: resolved.reason,
        outputKind: String(stateRecord.kind ?? 'unknown'),
        title: String(stateRecord.title ?? screen.name),
        durationSeconds,
        elapsedSeconds,
        mediaError:
            stateRecord.kind === 'fallback'
                ? `No playable output (${String(stateRecord.reason ?? 'fallback')})`
                : null,
    };
}