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

/** @deprecated Schedule-era alias. Prefer SignageMonitorPayload. */
export type OutputMonitorPayload = SignageMonitorPayload;

export type UpNextBlock = {
    id: string;
    title: string;
    startTimeSeconds: number;
    durationSeconds: number;
    status: string;
};
