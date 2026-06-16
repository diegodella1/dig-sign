'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

type PlaylistOption = {
    id: string;
    name: string;
    itemCount: number;
};

type Props = {
    playlists: PlaylistOption[];
    selectedPlaylistId: string | null;
    saveAction: (formData: FormData) => Promise<void>;
};

export function FallbackPlaylistSelector({
    playlists,
    selectedPlaylistId,
    saveAction,
}: Props) {
    const router = useRouter();
    const [playlistId, setPlaylistId] = useState(selectedPlaylistId ?? playlists[0]?.id ?? '');
    const [message, setMessage] = useState('');

    return (
        <form
            action={async (formData) => {
                setMessage('');
                await saveAction(formData);
                setMessage('Fallback playlist saved.');
                router.refresh();
            }}
            className="surface-panel mt-4 space-y-3 p-4"
        >
            <div>
                <h2 className="text-lg font-semibold">Fallback playlist</h2>
                <p className="mt-1 text-sm text-muted">
                    Plate rotations and emergency slates use this playlist. Carousel videos pause it
                    and resume when plates return.
                </p>
            </div>
            <label className="block text-sm">
                <span className="mb-1 block text-muted">Playlist</span>
                <select
                    name="playlist_id"
                    value={playlistId}
                    onChange={(event) => setPlaylistId(event.target.value)}
                    className="w-full border border-line px-3 py-2"
                >
                    {playlists.map((playlist) => (
                        <option key={playlist.id} value={playlist.id}>
                            {playlist.name} ({playlist.itemCount} tracks)
                        </option>
                    ))}
                </select>
            </label>
            <button type="submit" className="btn-primary text-sm">
                Save fallback playlist
            </button>
            {message ? <p className="text-sm text-success">{message}</p> : null}
        </form>
    );
}
