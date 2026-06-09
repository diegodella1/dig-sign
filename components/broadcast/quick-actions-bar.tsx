'use client';

import { StopBroadcastButton } from '@/components/output/stop-broadcast-button';

type QuickActionsBarProps = {
    liveBrowserHref: string;
    outputControlHref: string;
    replaceAssetHref: string | null;
    scheduleHref: string;
    canStop: boolean;
    canPause: boolean;
    canResume: boolean;
    canSkip: boolean;
    canGoNext: boolean;
    pauseAction: () => Promise<void>;
    stopAction: () => Promise<void>;
    resumeAction: () => Promise<void>;
    skipAction: () => Promise<void>;
    goNextAction: () => Promise<void>;
    emergencyLoopAction: () => Promise<void>;
};

export function QuickActionsBar({
    liveBrowserHref,
    outputControlHref,
    replaceAssetHref,
    scheduleHref,
    canStop,
    canPause,
    canResume,
    canSkip,
    canGoNext,
    pauseAction,
    stopAction,
    resumeAction,
    skipAction,
    goNextAction,
    emergencyLoopAction,
}: QuickActionsBarProps) {
    return (
        <aside className="space-y-3" aria-label="Quick actions">
            <section className="rounded-md border border-line bg-surface-elevated-2 p-3">
                <h3 className="text-[10px] font-bold uppercase tracking-wide text-muted">Live</h3>
                <div className="mt-2 grid gap-2">
                    <a
                        className="btn-primary min-h-9 w-full text-center text-sm"
                        href={liveBrowserHref}
                        target="_blank"
                        rel="noreferrer"
                    >
                        Live output
                    </a>
                    {canGoNext ? (
                        <form action={goNextAction}>
                            <button type="submit" className="btn-primary min-h-9 w-full text-sm">
                                Go next
                            </button>
                        </form>
                    ) : null}
                    {canSkip ? (
                        <form action={skipAction}>
                            <button type="submit" className="btn-secondary min-h-9 w-full text-sm">
                                Skip block
                            </button>
                        </form>
                    ) : null}
                    <form action={emergencyLoopAction}>
                        <button type="submit" className="btn-secondary min-h-9 w-full text-sm">
                            Emergency loop
                        </button>
                    </form>
                    {canResume ? (
                        <form action={resumeAction}>
                            <button type="submit" className="btn-secondary min-h-9 w-full text-sm">
                                Resume
                            </button>
                        </form>
                    ) : null}
                    {canPause ? (
                        <form action={pauseAction}>
                            <button type="submit" className="btn-secondary min-h-9 w-full text-sm">
                                Pause override
                            </button>
                        </form>
                    ) : null}
                    {canStop ? (
                        <StopBroadcastButton
                            action={stopAction}
                            disabled={false}
                            label="Stop broadcast"
                            confirmMessage="Stop the broadcast? Day status will revert to ready."
                        />
                    ) : null}
                </div>
            </section>

            <section className="rounded-md border border-line bg-surface-elevated-2 p-3">
                <h3 className="text-[10px] font-bold uppercase tracking-wide text-muted">Links</h3>
                <div className="mt-2 grid gap-2">
                    {replaceAssetHref ? (
                        <a className="btn-secondary min-h-9 w-full text-center text-sm" href={replaceAssetHref}>
                            Replace asset
                        </a>
                    ) : null}
                    <a className="btn-secondary min-h-9 w-full text-center text-sm" href={outputControlHref}>
                        Capture
                    </a>
                    <a className="btn-secondary min-h-9 w-full text-center text-sm" href={scheduleHref}>
                        Rundown
                    </a>
                </div>
            </section>
        </aside>
    );
}
