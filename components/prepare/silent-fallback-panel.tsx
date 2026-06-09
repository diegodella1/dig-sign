'use client';

import Link from 'next/link';

import type { MediaAsset } from '@/lib/types';

type SilentFallbackPanelProps = {
    candidates: MediaAsset[];
    activeAssetId: string | null;
    setSilentFallback: (formData: FormData) => Promise<void>;
    clearSilentFallback: (formData: FormData) => Promise<void>;
};

export function SilentFallbackPanel({
    candidates,
    activeAssetId,
    setSilentFallback,
    clearSilentFallback,
}: SilentFallbackPanelProps) {
    const activeAsset = candidates.find((asset) => asset.id === activeAssetId) ?? null;

    return (
        <section className="surface-panel p-4">
            <h2 className="text-sm font-semibold">Silent fallback video</h2>
            <p className="mt-1 text-sm text-muted">
                Optional. When set, this single muted video loops during schedule gaps before the
                rotating carousel below.
            </p>

            <div className="mt-4 grid gap-3 md:grid-cols-[minmax(0,1fr)_auto]">
                <form action={setSilentFallback} className="grid gap-2">
                    <label className="grid gap-1 text-xs font-semibold text-muted">
                        Pick from Media
                        <select
                            name="asset_id"
                            defaultValue={activeAssetId ?? ''}
                            className="border border-line px-3 py-2 text-sm font-normal text-ink"
                            required
                        >
                            <option value="" disabled>
                                Select a ready video…
                            </option>
                            {candidates.map((asset) => (
                                <option key={asset.id} value={asset.id}>
                                    {asset.title}
                                </option>
                            ))}
                        </select>
                    </label>
                    <button type="submit" className="btn-primary w-fit">
                        Set silent video
                    </button>
                </form>

                {activeAsset ? (
                    <div className="rounded-md border border-line bg-panel-soft p-3 text-sm">
                        <p className="font-semibold">{activeAsset.title}</p>
                        <p className="mt-1 text-xs text-muted">Currently active silent loop</p>
                        <form action={clearSilentFallback} className="mt-3">
                            <button type="submit" className="btn-secondary min-h-9">
                                Clear silent video
                            </button>
                        </form>
                    </div>
                ) : (
                    <p className="self-center text-sm text-muted">No silent video selected.</p>
                )}
            </div>

            {!candidates.length ? (
                <p className="mt-3 rounded-md border border-warn-line bg-warn-soft px-3 py-2 text-sm text-warn-strong">
                    No ready videos in Media yet.{' '}
                    <Link href="/admin/assets" className="font-semibold underline">
                        Upload media
                    </Link>
                </p>
            ) : null}
        </section>
    );
}
