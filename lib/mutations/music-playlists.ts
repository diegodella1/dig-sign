import { auditedMutation } from '../audit/audit';
import {
    archivePlaylist,
    createPlaylist,
    getMusicOutputSettings,
    saveMusicOutputSettings,
    setPlaylistItems,
    updatePlaylist,
    type MusicOutputSettings,
    type MusicPlaylistStatus,
} from '../music-playlists';
import { err, extractError, ok, type Result } from '../result';

export async function createMusicPlaylist(input: {
    name: string;
    status?: MusicPlaylistStatus;
}): Promise<Result<{ id: string }>> {
    try {
        const playlist = await auditedMutation(
            {
                action: 'music_playlist.created',
                entityType: 'music_playlists',
                metadata: { name: input.name },
            },
            async () => createPlaylist(input),
        );

        return ok({ id: playlist.id });
    } catch (error) {
        return err(extractError(error));
    }
}

export async function updateMusicPlaylist(input: {
    id: string;
    name?: string;
    status?: MusicPlaylistStatus;
}): Promise<Result<void>> {
    try {
        await auditedMutation(
            {
                action: 'music_playlist.updated',
                entityType: 'music_playlists',
                entityId: input.id,
                metadata: { name: input.name, status: input.status },
            },
            async () => {
                const updated = await updatePlaylist(input.id, {
                    ...(input.name ? { name: input.name } : {}),
                    ...(input.status ? { status: input.status } : {}),
                });

                if (!updated) {
                    throw new Error('Playlist not found');
                }
            },
        );

        return ok(undefined);
    } catch (error) {
        return err(extractError(error));
    }
}

export async function archiveMusicPlaylist(playlistId: string): Promise<Result<void>> {
    try {
        await auditedMutation(
            {
                action: 'music_playlist.archived',
                entityType: 'music_playlists',
                entityId: playlistId,
            },
            async () => {
                const archived = await archivePlaylist(playlistId);

                if (!archived) {
                    throw new Error('Playlist not found');
                }
            },
        );

        return ok(undefined);
    } catch (error) {
        return err(extractError(error));
    }
}

export async function saveMusicPlaylistItems(input: {
    playlistId: string;
    assetIds: string[];
}): Promise<Result<void>> {
    try {
        await auditedMutation(
            {
                action: 'music_playlist.items_updated',
                entityType: 'music_playlists',
                entityId: input.playlistId,
                metadata: { count: input.assetIds.length },
            },
            async () => {
                const saved = await setPlaylistItems(input.playlistId, input.assetIds);

                if (!saved) {
                    throw new Error('Playlist not found or invalid tracks');
                }
            },
        );

        return ok(undefined);
    } catch (error) {
        return err(extractError(error));
    }
}

export async function saveMusicOutputConfig(
    input: Partial<MusicOutputSettings>,
): Promise<Result<MusicOutputSettings>> {
    try {
        const current = await getMusicOutputSettings();
        const next = await auditedMutation(
            {
                action: 'music_output.updated',
                entityType: 'integration_settings',
                entityId: 'music_output',
                metadata: input as Record<string, unknown>,
            },
            async () => saveMusicOutputSettings({ ...current, ...input }),
        );

        return ok(next);
    } catch (error) {
        return err(extractError(error));
    }
}

export async function assignSchedulePlaylist(playlistId: string): Promise<Result<MusicOutputSettings>> {
    return saveMusicOutputConfig({ schedulePlaylistId: playlistId });
}

export async function assignFallbackPlaylist(playlistId: string): Promise<Result<MusicOutputSettings>> {
    return saveMusicOutputConfig({ fallbackPlaylistId: playlistId });
}

export async function readMusicOutputConfig(): Promise<MusicOutputSettings> {
    return getMusicOutputSettings();
}
