import { auditedMutation } from '../audit/audit';
import {
    createContentPlaylist,
    createPlaylistAssignment,
    deletePlaylistAssignment,
    setContentPlaylistItems,
    updateContentPlaylist,
    type PlaylistOrientation,
    type ContentPlaylistStatus,
    type WeekdayKey,
} from '../content-playlists';
import { err, extractError, ok, type Result } from '../result';

export async function createSignagePlaylist(input: {
    name: string;
    status?: ContentPlaylistStatus;
    orientation?: PlaylistOrientation;
}): Promise<Result<{ id: string }>> {
    try {
        const playlist = await auditedMutation(
            {
                action: 'content_playlist.created',
                entityType: 'content_playlists',
                metadata: { name: input.name, orientation: input.orientation },
            },
            async () => createContentPlaylist(input),
        );

        return ok({ id: playlist.id });
    } catch (error) {
        return err(extractError(error));
    }
}

export async function updateSignagePlaylist(input: {
    id: string;
    name?: string;
    status?: ContentPlaylistStatus;
    orientation?: PlaylistOrientation;
}): Promise<Result<void>> {
    try {
        await auditedMutation(
            {
                action: 'content_playlist.updated',
                entityType: 'content_playlists',
                entityId: input.id,
                metadata: {
                    name: input.name,
                    status: input.status,
                    orientation: input.orientation,
                },
            },
            async () => {
                const updated = await updateContentPlaylist(input.id, input);

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

export async function saveSignagePlaylistItems(input: {
    playlistId: string;
    items: Array<{
        assetId?: string | null;
        slideId?: string | null;
        durationSeconds?: number | null;
    }>;
}): Promise<Result<void>> {
    try {
        await auditedMutation(
            {
                action: 'content_playlist.items_saved',
                entityType: 'content_playlists',
                entityId: input.playlistId,
                metadata: { itemCount: input.items.length },
            },
            async () => setContentPlaylistItems(input.playlistId, input.items),
        );

        return ok(undefined);
    } catch (error) {
        return err(extractError(error));
    }
}

export async function assignPlaylistToScreen(input: {
    screenId: string;
    playlistId: string;
    startDate?: string | null;
    endDate?: string | null;
    weekdays?: WeekdayKey[];
    priority?: number;
}): Promise<Result<{ id: string }>> {
    try {
        const assignment = await auditedMutation(
            {
                action: 'playlist_assignment.created',
                entityType: 'playlist_assignments',
                metadata: {
                    screenId: input.screenId,
                    playlistId: input.playlistId,
                    priority: input.priority ?? 0,
                },
            },
            async () => createPlaylistAssignment(input),
        );

        return ok({ id: assignment.id });
    } catch (error) {
        return err(extractError(error));
    }
}

export async function removePlaylistAssignment(id: string): Promise<Result<void>> {
    try {
        await auditedMutation(
            {
                action: 'playlist_assignment.deleted',
                entityType: 'playlist_assignments',
                entityId: id,
            },
            async () => deletePlaylistAssignment(id),
        );

        return ok(undefined);
    } catch (error) {
        return err(extractError(error));
    }
}
