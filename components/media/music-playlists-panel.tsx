'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

type Playlist = {
    id: string;
    name: string;
    status: string;
    itemCount: number;
};

type PlaylistDetail = Playlist & {
    assetIds: string[];
};

type TrackOption = {
    id: string;
    title: string;
    status: string;
    ready: boolean;
};

type OutputSettings = {
    enabled: boolean;
    volume: number;
    fade: 'none' | 'short';
    schedulePlaylistId: string | null;
    fallbackPlaylistId: string | null;
};

type Props = {
    tracks: TrackOption[];
    initialPlaylists: Playlist[];
    initialSettings: OutputSettings;
    createPlaylistAction: (formData: FormData) => Promise<void>;
    assignSchedulePlaylistAction?: (formData: FormData) => Promise<void>;
};

export function MusicPlaylistsPanel({
    tracks,
    initialPlaylists,
    initialSettings,
    createPlaylistAction,
    assignSchedulePlaylistAction,
}: Props) {
    const router = useRouter();
    const [playlists] = useState(initialPlaylists);
    const [settings, setSettings] = useState(initialSettings);
    const [selectedId, setSelectedId] = useState(
        initialSettings.schedulePlaylistId ?? initialPlaylists[0]?.id ?? '',
    );
    const [detail, setDetail] = useState<PlaylistDetail | null>(null);
    const [selectedAssetIds, setSelectedAssetIds] = useState<string[]>([]);
    const [message, setMessage] = useState('');
    const [pending, setPending] = useState(false);

    useEffect(() => {
        if (!selectedId) {
            return;
        }

        let cancelled = false;

        void fetch(`/api/music/playlists/${selectedId}`, { cache: 'no-store' })
            .then((response) => (response.ok ? response.json() : null))
            .then((payload: PlaylistDetail | null) => {
                if (cancelled || !payload) {
                    return;
                }

                setDetail(payload);
                setSelectedAssetIds(payload.assetIds);
            })
            .catch(() => undefined);

        return () => {
            cancelled = true;
        };
    }, [selectedId]);

    const activeDetail = detail?.id === selectedId ? detail : null;

    async function saveItems() {
        if (!selectedId) {
            return;
        }

        setPending(true);
        setMessage('');

        try {
            const response = await fetch(`/api/music/playlists/${selectedId}/items`, {
                method: 'PUT',
                headers: {
                    'content-type': 'application/json',
                    'x-csrf-token': csrfCookie(),
                },
                body: JSON.stringify({ assetIds: selectedAssetIds }),
            });
            const payload = await response.json().catch(() => null);

            if (!response.ok) {
                throw new Error(payload?.error ?? 'Could not save playlist items');
            }

            setDetail(payload);
            setMessage('Playlist saved.');
            router.refresh();
        } catch (error) {
            setMessage(error instanceof Error ? error.message : 'Save failed');
        } finally {
            setPending(false);
        }
    }

    function toggleTrack(assetId: string) {
        setSelectedAssetIds((current) =>
            current.includes(assetId)
                ? current.filter((id) => id !== assetId)
                : [...current, assetId],
        );
    }

    function moveTrack(assetId: string, direction: -1 | 1) {
        setSelectedAssetIds((current) => {
            const index = current.indexOf(assetId);

            if (index < 0) {
                return current;
            }

            const nextIndex = index + direction;

            if (nextIndex < 0 || nextIndex >= current.length) {
                return current;
            }

            const next = [...current];
            const item = next[index];

            if (!item) {
                return current;
            }

            next.splice(index, 1);
            next.splice(nextIndex, 0, item);

            return next;
        });
    }

    return (
        <section className="surface-panel p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                    <h2 className="text-lg font-semibold">Playlists</h2>
                    <p className="mt-1 text-sm text-muted">
                        Build named playlists from ready tracks for optional background audio.
                    </p>
                </div>
                <form action={createPlaylistAction} className="flex flex-wrap gap-2">
                    <input
                        name="name"
                        required
                        placeholder="New playlist name"
                        className="border border-line px-3 py-2 text-sm"
                    />
                    <button type="submit" className="btn-secondary text-sm">
                        Create
                    </button>
                </form>
            </div>

            <div className="mt-4 grid gap-4 lg:grid-cols-[220px_minmax(0,1fr)]">
                <div className="space-y-2">
                    {playlists.map((playlist) => (
                        <button
                            key={playlist.id}
                            type="button"
                            onClick={() => {
                                if (selectedId !== playlist.id) {
                                    setDetail(null);
                                    setSelectedAssetIds([]);
                                }

                                setSelectedId(playlist.id);
                            }}
                            className={[
                                'w-full rounded-md border px-3 py-2 text-left text-sm',
                                selectedId === playlist.id
                                    ? 'border-accent-positive bg-panel-soft font-semibold'
                                    : 'border-line',
                            ].join(' ')}
                        >
                            <span>{playlist.name}</span>
                            <span className="mt-1 block text-xs text-muted">
                                {playlist.itemCount} tracks
                            </span>
                        </button>
                    ))}
                    {playlists.length === 0 ? (
                        <p className="text-sm text-muted">Create a playlist to get started.</p>
                    ) : null}
                </div>

                <div className="space-y-4">
                    {selectedId && !activeDetail ? (
                        <p className="text-sm text-muted">Loading playlist…</p>
                    ) : activeDetail ? (
                        <>
                            {assignSchedulePlaylistAction ? (
                                <form
                                    action={assignSchedulePlaylistAction}
                                    className="flex flex-wrap items-center gap-2 rounded-md bg-panel-soft p-3"
                                >
                                    <input type="hidden" name="playlist_id" value={activeDetail.id} />
                                    <label className="flex items-center gap-2 text-sm">
                                        <input
                                            type="radio"
                                            name="schedule_default"
                                            checked={settings.schedulePlaylistId === activeDetail.id}
                                            readOnly
                                            onClick={() =>
                                                setSettings((current) => ({
                                                    ...current,
                                                    schedulePlaylistId: activeDetail.id,
                                                }))
                                            }
                                        />
                                        Schedule default playlist
                                    </label>
                                    <button type="submit" className="btn-primary text-sm">
                                        Set as schedule playlist
                                    </button>
                                </form>
                            ) : null}

                            <div className="space-y-2">
                                <p className="text-xs font-semibold uppercase tracking-wide text-muted">
                                    Playlist order
                                </p>
                                {selectedAssetIds.map((assetId) => {
                                    const track = tracks.find((item) => item.id === assetId);

                                    return (
                                        <div
                                            key={assetId}
                                            className="flex items-center gap-2 rounded-md border border-line px-3 py-2 text-sm"
                                        >
                                            <span className="flex-1">
                                                {track?.title ?? assetId}
                                            </span>
                                            <button
                                                type="button"
                                                className="rounded border border-line px-2 py-1 text-xs"
                                                onClick={() => moveTrack(assetId, -1)}
                                            >
                                                Up
                                            </button>
                                            <button
                                                type="button"
                                                className="rounded border border-line px-2 py-1 text-xs"
                                                onClick={() => moveTrack(assetId, 1)}
                                            >
                                                Down
                                            </button>
                                            <button
                                                type="button"
                                                className="rounded border border-line px-2 py-1 text-xs text-warn"
                                                onClick={() => toggleTrack(assetId)}
                                            >
                                                Remove
                                            </button>
                                        </div>
                                    );
                                })}
                                {selectedAssetIds.length === 0 ? (
                                    <p className="text-sm text-muted">
                                        Add ready tracks from the library below.
                                    </p>
                                ) : null}
                            </div>

                            <div className="space-y-2">
                                <p className="text-xs font-semibold uppercase tracking-wide text-muted">
                                    Add tracks
                                </p>
                                {tracks
                                    .filter((track) => track.ready)
                                    .map((track) => (
                                        <label
                                            key={track.id}
                                            className="flex items-center gap-2 text-sm"
                                        >
                                            <input
                                                type="checkbox"
                                                checked={selectedAssetIds.includes(track.id)}
                                                onChange={() => toggleTrack(track.id)}
                                            />
                                            {track.title}
                                        </label>
                                    ))}
                            </div>

                            <button
                                type="button"
                                className="btn-primary"
                                disabled={pending}
                                onClick={() => void saveItems()}
                            >
                                {pending ? 'Saving…' : 'Save playlist'}
                            </button>
                        </>
                    ) : (
                        <p className="text-sm text-muted">Select a playlist to edit tracks.</p>
                    )}

                    {message ? <p className="text-sm text-muted">{message}</p> : null}
                </div>
            </div>
        </section>
    );
}

function csrfCookie() {
    return (
        document.cookie
            .split('; ')
            .find((part) => part.startsWith('rpm_csrf='))
            ?.split('=')[1] ?? ''
    );
}
