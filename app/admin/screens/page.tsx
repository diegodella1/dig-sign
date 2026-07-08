import { revalidatePath } from 'next/cache';
import Link from 'next/link';

import { programSubNav } from '@/components/broadcast/mode-sub-nav-items';
import { AdminShell } from '@/components/admin/admin-shell';
import { EmptyState, FormHeader, Notice } from '@/components/ui';
import { directLiveOutputHrefForScreen } from '@/lib/auth/output-auth';
import { createSignageScreen } from '@/lib/mutations';
import { listLayoutPresets, listScreens } from '@/lib/screens';

export const dynamic = 'force-dynamic';

export default async function ScreensPage() {
    const [screens, presets] = await Promise.all([listScreens(), listLayoutPresets()]);

    async function createScreenAction(formData: FormData) {
        'use server';
        const result = await createSignageScreen({
            name: String(formData.get('name') || ''),
            slug: String(formData.get('slug') || ''),
            layoutPresetId: String(formData.get('layout_preset_id') || '') || null,
        });

        if (!result.success) {
            throw new Error(result.error);
        }

        revalidatePath('/admin/screens');
    }

    return (
        <AdminShell title="Screens" subNav={programSubNav}>
            <Notice tone="info" title="Multi-screen output">
                Each screen has its own player URL and day-based playlist assignments.
            </Notice>

            <section className="mt-4 rounded-md border border-line bg-surface-elevated-2 p-4">
                <FormHeader title="Add screen" detail="Create a player endpoint for a physical display." />
                <form action={createScreenAction} className="mt-3 grid gap-3 md:grid-cols-4">
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
                <FormHeader title="Active screens" detail="Each screen loops its assigned playlist for today." />
                {!screens.length ? (
                    <EmptyState title="No screens yet">
                        Create your first screen above.
                    </EmptyState>
                ) : (
                    <ul className="mt-3 divide-y divide-line rounded-md border border-line bg-surface-elevated-2">
                        {screens.map((screen) => (
                            <li
                                key={screen.id}
                                className="flex flex-wrap items-center justify-between gap-3 px-4 py-3"
                            >
                                <div>
                                    <p className="font-semibold">{screen.name}</p>
                                    <p className="text-sm text-muted">
                                        /output/live/{screen.slug} · {screen.timezone}
                                    </p>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    <Link
                                        href={`/admin/screens/${screen.slug}`}
                                        className="rounded-md border border-line px-3 py-1.5 text-sm"
                                    >
                                        Manage
                                    </Link>
                                    <a
                                        href={directLiveOutputHrefForScreen(screen.slug)}
                                        className="rounded-md border border-line px-3 py-1.5 text-sm"
                                        target="_blank"
                                        rel="noreferrer"
                                    >
                                        Open player
                                    </a>
                                </div>
                            </li>
                        ))}
                    </ul>
                )}
            </section>
        </AdminShell>
    );
}
