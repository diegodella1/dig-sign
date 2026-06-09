export type OutputMonitorPayload = {
    generatedAt: string;
    timezone: string;
    serverSeconds: number;
    day: { airDate: string; status: string } | null;
    block: {
        title: string;
        status: string;
        elapsedInBlock: number;
        durationSeconds: number;
    } | null;
    asset: {
        id?: string;
        title: string;
        sourceType: string;
        status: string;
        lifecycleState: string;
        playbackReadinessStatus: string;
        playbackError: string | null;
    } | null;
    fallback: { title: string } | null;
    fallbackReason: string | null;
    override: {
        id: string;
        sourceType: string;
        label: string | null;
        streamProtocol: string | null;
        expiresAt: string | null;
    } | null;
    mediaError: string | null;
};

export type UpNextBlock = {
    id: string;
    title: string;
    startTimeSeconds: number;
    durationSeconds: number;
    status: string;
};
