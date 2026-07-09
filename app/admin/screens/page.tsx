import { revalidatePath } from 'next/cache';
import Link from 'next/link';

import { programSubNav } from '@/components/broadcast/mode-sub-nav-items';
import { AdminShell } from '@/components/admin/admin-shell';
import { GoogleMapsAddressHelper } from '@/components/signage/google-maps-address-helper';
import { ClearStateBadge, EmptyState, FormHeader, Notice } from '@/components/ui';
import { directLiveOutputHrefForScreen } from '@/lib/auth/output-auth';
import { createSignageScreen } from '@/lib/mutations';
import { buildSignageMonitorPayload } from '@/lib/output/screen-monitor';
import { listLayoutPresets, listScreens, screenMapsHref } from '@/lib/screens';

export const dynamic = 'force-dynamic';

export default async function ScreensPage() {
    const [screens, presets, monitor] = await Promise.all([
        listScreens(),
        listLayoutPresets(),
        buildSignageMonitorPayload(),
    ]);
    const monitorBySlug = new Map(monitor.screens.map((screen) => [screen.slug, screen]));

    async function createScreenAction(formData: FormData) {
        'use server';
        const result = await createSignageScreen({
            name: String(formData.get('name') || ''),
            slug: String(formData.get('slug') || ''),
            layoutPresetId: String(formData.get('layout_preset_id') || '') || null,
            orientation:
                String(formData.get('orientation') || 'horizontal') === 'vertical'
                    ? 'vertical'
                    : 'horizontal',
            locationName: String(formData.get('location_name') || '') || null,
            address: String(formData.get('address') || '') || null,
            googleMapsUrl: String(formData.get('google_maps_url') || '') || null,
        });

        if (!result.success) {
            throw new Error(result.error);
        }

        revalidatePath('/admin/screens');
    }

    return (
        <AdminShell title="Screens" subNav={programSubNav}>
            <Notice tone="info" title="Pantallas">
                Cada pantalla tiene orientacion, player URL y playlist compatible asignada.
            </Notice>

            <section className="mt-4 rounded-md border border-line bg-surface-elevated-2 p-4">
                <FormHeader
                    title="Add screen"
                    detail="Create a player endpoint for a physical display."
                />
                <form action={createScreenAction} className="mt-3 grid gap-3 md:grid-cols-6">
                    <label className="grid gap-1 text-sm">
                        <span className="text-muted">Name</span>
                        <input
                            name="name"
                            required
                            className="rounded-md border border-line bg-surface px-3 py-2"
                        />
                    </label>
                    <label className="grid gap-1 text-sm">
                        <span className="text-muted">Slug</span>
                        <input
                            name="slug"
                            required
                            placeholder="lobby"
                            className="rounded-md border border-line bg-surface px-3 py-2"
                        />
                    </label>
                    <label className="grid gap-1 text-sm">
                        <span className="text-muted">Layout preset</span>
                        <select
                            name="layout_preset_id"
                            className="rounded-md border border-line bg-surface px-3 py-2"
                        >
                            <option value="">Default</option>
                            {presets.map((preset) => (
                                <option key={preset.id} value={preset.id}>
                                    {preset.name}
                                </option>
                            ))}
                        </select>
                    </label>
                    <label className="grid gap-1 text-sm">
                        <span className="text-muted">Orientation</span>
                        <select
                            name="orientation"
                            defaultValue="horizontal"
                            className="rounded-md border border-line bg-surface px-3 py-2"
                        >
                            <option value="horizontal">Horizontal 16:9</option>
                            <option value="vertical">Vertical 9:16</option>
                        </select>
                    </label>
                    <GoogleMapsAddressHelper className="md:col-span-5" />
                    <div className="flex items-end">
                        <button
                            type="submit"
                            className="rounded-md bg-accent-positive px-4 py-2 text-sm font-semibold text-white"
                        >
                            Create
                        </button>
                    </div>
                </form>
            </section>

            <section className="mt-6">
                <FormHeader
                    title="Pantallas activas"
                    detail="Estado actual, playlist en reproduccion y acciones de setup."
                />
                {!screens.length ? (
                    <EmptyState title="No tenes pantallas">
                        Pedi al admin que cree una o agregala aca.
                    </EmptyState>
                ) : (
                    <div className="mt-3 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                        {screens.map((screen) => {
                            const mapsHref = screenMapsHref(screen);
                            const status = monitorBySlug.get(screen.slug);
                            const blocked = !status?.playlistId || status.outputKind === 'fallback';

                            return (
                                <article
                                    key={screen.id}
                                    className={`surface-card p-4 ${blocked ? 'border-warn-line' : 'border-success-line'}`}
                                >
                                    <div className="flex items-start justify-between gap-3">
                                        <div>
                                            <h3 className="font-display text-xl font-bold uppercase">
                                                {screen.name}
                                            </h3>
                                            <p className="mt-1 text-sm text-muted">
                                                {screen.orientation === 'vertical'
                                                    ? 'Vertical 9:16'
                                                    : 'Horizontal 16:9'}{' '}
                                                · {screen.timezone}
                                            </p>
                                        </div>
                                        <ClearStateBadge tone={blocked ? 'warn' : 'ok'}>
                                            {blocked ? 'accion' : 'online'}
                                        </ClearStateBadge>
                                    </div>
                                    <div className="mt-4 border-t border-line pt-3">
                                        <p className="text-[10px] font-bold uppercase text-muted">
                                            Reproduciendo
                                        </p>
                                        <p className="mt-1 font-semibold">
                                            {status?.playlistName ?? 'Sin playlist asignada'}
                                        </p>
                                        <p className="mt-1 text-sm text-muted">
                                            {status?.title ?? `Player /output/live/${screen.slug}`}
                                        </p>
                                        {screen.locationName || screen.address ? (
                                            <p className="mt-1 text-sm text-muted">
                                                {screen.locationName ?? 'Location'}{' '}
                                                {screen.address ? `· ${screen.address}` : ''}
                                            </p>
                                        ) : null}
                                    </div>
                                    <div className="mt-4 flex flex-wrap gap-2">
                                        {mapsHref ? (
                                            <a
                                                href={mapsHref}
                                                className="btn-secondary"
                                                target="_blank"
                                                rel="noreferrer"
                                            >
                                                Maps
                                            </a>
                                        ) : null}
                                        <Link
                                            href={`/admin/screens/${screen.slug}`}
                                            className="btn-primary"
                                        >
                                            Manage
                                        </Link>
                                        <a
                                            href={directLiveOutputHrefForScreen(screen.slug)}
                                            className="btn-secondary"
                                            target="_blank"
                                            rel="noreferrer"
                                        >
                                            Open player
                                        </a>
                                    </div>
                                </article>
                            );
                        })}
                    </div>
                )}
            </section>
        </AdminShell>
    );
}
