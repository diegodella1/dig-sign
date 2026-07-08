import { adminSubNav } from '@/components/broadcast/mode-sub-nav-items';
import { AdminShell } from '@/components/admin/admin-shell';
import { FormHeader, Notice } from '@/components/ui';
import { requireTenantScope } from '@/lib/auth/tenancy';
import { createOperator, listOperators } from '@/lib/auth/operators';
import { createVendor, listVendors } from '@/lib/vendors';

export const dynamic = 'force-dynamic';

export default async function SettingsPage({
    searchParams,
}: {
    searchParams: Promise<{ saved?: string }>;
}) {
    const params = await searchParams;
    const [scope, operators, vendors] = await Promise.all([
        requireTenantScope(),
        listOperators().catch(() => []),
        listVendors().catch(() => []),
    ]);

    async function addOperator(formData: FormData) {
        'use server';
        await createOperator({
            handle: String(formData.get('handle') || ''),
            displayName: String(formData.get('display_name') || ''),
            role: String(formData.get('role') || 'operator'),
            vendorId: String(formData.get('vendor_id') || '') || null,
            token: String(formData.get('token') || ''),
        });
    }

    async function addVendor(formData: FormData) {
        'use server';
        await createVendor({
            name: String(formData.get('name') || ''),
            slug: String(formData.get('slug') || ''),
        });
    }

    return (
        <AdminShell
            title="Admin"
            description="Operators and system configuration."
            subNav={adminSubNav}
        >
            {params.saved ? <Notice tone="ok">Settings saved.</Notice> : null}

            {scope.kind === 'global' ? (
                <section className="surface-panel mb-6 p-5">
                    <FormHeader
                        title="Vendors"
                        detail="Only super admins can create vendors. Each vendor gets isolated screens, playlists, assets and operators."
                    />
                    <form
                        action={addVendor}
                        className="mt-4 grid gap-3 md:grid-cols-[1fr_1fr_160px]"
                    >
                        <input
                            name="name"
                            required
                            placeholder="Vendor name"
                            className="border border-line px-3 py-2 text-sm"
                        />
                        <input
                            name="slug"
                            placeholder="vendor-slug"
                            className="border border-line px-3 py-2 text-sm"
                        />
                        <button className="btn-primary">Create vendor</button>
                    </form>
                    <div className="mt-4 grid gap-2 md:grid-cols-2 xl:grid-cols-3">
                        {vendors.map((vendor) => (
                            <div
                                key={vendor.id}
                                className="border-2 border-line bg-panel-soft px-3 py-2 text-sm"
                            >
                                <p className="font-headline font-bold uppercase">{vendor.name}</p>
                                <p className="text-muted">{vendor.slug}</p>
                            </div>
                        ))}
                    </div>
                </section>
            ) : null}

            <section className="surface-panel max-w-4xl p-5">
                <FormHeader
                    title="Operators"
                    detail="Create named operators for audit identity. Vendor operators only see their assigned vendor data."
                />
                <form action={addOperator} className="mt-4 grid gap-3 md:grid-cols-2">
                    <input
                        name="handle"
                        required
                        placeholder="operator-handle"
                        className="border border-line px-3 py-2 text-sm"
                    />
                    <input
                        name="display_name"
                        required
                        placeholder="Display name"
                        className="border border-line px-3 py-2 text-sm"
                    />
                    <select
                        name="role"
                        defaultValue={scope.kind === 'global' ? 'vendor_admin' : 'operator'}
                        className="border border-line px-3 py-2 text-sm"
                    >
                        {scope.kind === 'global' ? (
                            <option value="super_admin">Super admin</option>
                        ) : null}
                        <option value="vendor_admin">Vendor admin</option>
                        <option value="operator">Operator</option>
                    </select>
                    {scope.kind === 'global' ? (
                        <select
                            name="vendor_id"
                            defaultValue={vendors[0]?.id ?? ''}
                            className="border border-line px-3 py-2 text-sm"
                        >
                            <option value="">No vendor (super admin only)</option>
                            {vendors.map((vendor) => (
                                <option key={vendor.id} value={vendor.id}>
                                    {vendor.name}
                                </option>
                            ))}
                        </select>
                    ) : (
                        <input type="hidden" name="vendor_id" value={scope.vendorId} />
                    )}
                    <input
                        name="token"
                        type="password"
                        required
                        placeholder="Initial token"
                        className="border border-line px-3 py-2 text-sm"
                    />
                    <button className="btn-primary md:col-span-2">Create or rotate operator</button>
                </form>
                <div className="mt-4 grid gap-2">
                    {operators.map((operator) => (
                        <div
                            key={operator.id}
                            className="grid gap-2 border-2 border-line bg-panel-soft px-3 py-2 text-sm md:grid-cols-[1fr_160px_120px_100px]"
                        >
                            <span>
                                {operator.displayName} ({operator.handle})
                            </span>
                            <span className="text-muted">
                                {vendors.find((vendor) => vendor.id === operator.vendorId)?.name ??
                                    'Global'}
                            </span>
                            <span className="text-muted">{operator.role}</span>
                            <span className="text-muted">{operator.status}</span>
                        </div>
                    ))}
                </div>
            </section>
        </AdminShell>
    );
}
