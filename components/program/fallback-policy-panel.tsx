'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';

import type { FallbackPolicyMode, FallbackPolicyStatus } from '@/lib/fallback-policy';
import type { MediaAsset } from '@/lib/types';
import type { FallbackCarousel } from '@/lib/fallback-carousel';

type FallbackPolicyPanelProps = {
    status: FallbackPolicyStatus;
    videoCandidates: MediaAsset[];
    carousel: FallbackCarousel | null;
    selectedVideoId: string;
    selectedRotationSetId: string;
    savePolicy: (formData: FormData) => Promise<void>;
};

export function FallbackPolicyPanel({
    status,
    videoCandidates,
    carousel,
    selectedVideoId,
    selectedRotationSetId,
    savePolicy,
}: FallbackPolicyPanelProps) {
    const [mode, setMode] = useState<FallbackPolicyMode>(status.mode);
    const rotationSets = useMemo(() => carousel?.sets ?? [], [carousel?.sets]);

    return (
        <section className="surface-panel overflow-hidden">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-4 py-3">
                <div>
                    <h2 className="text-sm font-semibold">Fallback policy</h2>
                    <p className="mt-1 text-sm text-muted">
                        Plays when the rundown has no active block or playback fails.
                    </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                    <span
                        className={
                            status.ready
                                ? 'rounded-md bg-ok-soft px-2 py-1 text-xs font-semibold text-ok-strong'
                                : 'rounded-md bg-warn-soft px-2 py-1 text-xs font-semibold text-warn-strong'
                        }
                    >
                        {status.ready ? 'Ready' : 'Not ready'}
                    </span>
                    <Link href="/output/live" className="btn-secondary min-h-8 px-3 text-xs">
                        Preview output
                    </Link>
                </div>
            </div>

            <form action={savePolicy} className="grid gap-4 p-4">
                <input type="hidden" name="mode" value={mode} />

                <div className="rounded-md border border-line bg-panel-soft px-3 py-2 text-sm">
                    <span className="font-semibold text-ink">Current: </span>
                    <span className="text-muted">{status.label}</span>
                    {status.detail ? (
                        <p className="mt-1 text-xs text-muted">{status.detail}</p>
                    ) : null}
                </div>

                <fieldset className="grid gap-2">
                    <legend className="text-xs font-bold uppercase text-muted">Choose policy</legend>
                    <PolicyOption
                        checked={mode === 'silent_video'}
                        onChange={() => setMode('silent_video')}
                        title="Silent video loop"
                        detail="Muted video loop for gaps and playback failures."
                    />
                    <PolicyOption
                        checked={mode === 'plate_rotation'}
                        onChange={() => setMode('plate_rotation')}
                        title="Plate rotation"
                        detail="Rotate ready plates and short promo videos with background music."
                    />
                    <PolicyOption
                        checked={mode === 'emergency_only'}
                        onChange={() => setMode('emergency_only')}
                        title="Emergency slate only"
                        detail="Skip configured loops and use the built-in emergency slate."
                    />
                </fieldset>

                {mode === 'silent_video' ? (
                    <label className="grid gap-1 text-xs font-semibold text-muted">
                        Silent video
                        <select
                            name="video_id"
                            required
                            defaultValue={selectedVideoId}
                            className="border border-line px-3 py-2 text-sm font-normal text-ink"
                        >
                            <option value="">Select a video</option>
                            {videoCandidates.map((asset) => (
                                <option key={asset.id} value={asset.id}>
                                    {asset.title}
                                </option>
                            ))}
                        </select>
                        <span className="font-normal">
                            Mark videos as eligible in{' '}
                            <Link href="/admin/assets" className="text-accent-positive underline">
                                Media
                            </Link>
                            .
                        </span>
                    </label>
                ) : null}

                {mode === 'plate_rotation' ? (
                    <label className="grid gap-1 text-xs font-semibold text-muted">
                        Rotation set
                        <select
                            name="rotation_set_id"
                            required
                            defaultValue={selectedRotationSetId}
                            className="border border-line px-3 py-2 text-sm font-normal text-ink"
                        >
                            <option value="">Select a rotation set</option>
                            {rotationSets.map((set) => (
                                <option key={set.id} value={set.id}>
                                    {set.name} ({set.cards.length} cards)
                                </option>
                            ))}
                        </select>
                        <span className="font-normal">
                            Create or edit sets in the rotation editor below.
                        </span>
                    </label>
                ) : null}

                {mode === 'emergency_only' ? (
                    <p className="rounded-md border border-line bg-panel-soft px-3 py-2 text-sm text-muted">
                        No extra configuration. Output will show the emergency slate when nothing
                        else is available.
                    </p>
                ) : null}

                <div className="flex flex-wrap items-center gap-3">
                    <button type="submit" className="btn-primary">
                        Save policy
                    </button>
                    <p className="text-xs text-muted">
                        Background music plays under plate rotations. Manage tracks in{' '}
                        <Link href="/admin/music" className="text-accent-positive underline">
                            Music
                        </Link>
                        .
                    </p>
                </div>
            </form>
        </section>
    );
}

function PolicyOption({
    checked,
    onChange,
    title,
    detail,
}: {
    checked: boolean;
    onChange: () => void;
    title: string;
    detail: string;
}) {
    return (
        <label className="flex cursor-pointer items-start gap-3 rounded-md border border-line bg-surface px-3 py-3">
            <input
                type="radio"
                name="policy_mode_ui"
                checked={checked}
                onChange={onChange}
                aria-label={title}
                className="mt-1"
            />
            <span>
                <span className="block text-sm font-semibold text-ink">{title}</span>
                <span className="mt-0.5 block text-xs text-muted">{detail}</span>
            </span>
        </label>
    );
}
