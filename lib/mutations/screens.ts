import { auditedMutation } from '../audit/audit';
import { createScreen, updateScreen } from '../screens';
import { err, extractError, ok, type Result } from '../result';

export async function createSignageScreen(input: {
    name: string;
    slug: string;
    layoutPresetId?: string | null;
    fallbackPlaylistId?: string | null;
    timezone?: string | null;
    orientation?: 'horizontal' | 'vertical' | null;
}): Promise<Result<{ id: string; slug: string }>> {
    try {
        const screen = await auditedMutation(
            {
                action: 'screen.created',
                entityType: 'screens',
                metadata: { name: input.name, slug: input.slug },
            },
            async () => createScreen(input),
        );

        return ok({ id: screen.id, slug: screen.slug });
    } catch (error) {
        return err(extractError(error));
    }
}

export async function updateSignageScreen(input: {
    id: string;
    name?: string;
    slug?: string;
    layoutPresetId?: string | null;
    fallbackPlaylistId?: string | null;
    timezone?: string | null;
    orientation?: 'horizontal' | 'vertical' | null;
    status?: string;
}): Promise<Result<void>> {
    try {
        await auditedMutation(
            {
                action: 'screen.updated',
                entityType: 'screens',
                entityId: input.id,
                metadata: {
                    name: input.name,
                    slug: input.slug,
                    fallbackPlaylistId: input.fallbackPlaylistId,
                    orientation: input.orientation,
                },
            },
            async () => {
                const updated = await updateScreen(input.id, input);

                if (!updated) {
                    throw new Error('Screen not found');
                }
            },
        );

        return ok(undefined);
    } catch (error) {
        return err(extractError(error));
    }
}
