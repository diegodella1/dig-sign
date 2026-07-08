import { asc, eq } from 'drizzle-orm';

import { requireTenantScope, isGlobalRole } from './auth/tenancy';
import { getDb } from './db/client';
import { vendors, type VendorRow } from './db/schema';

export type Vendor = {
    id: string;
    name: string;
    slug: string;
    status: 'active' | 'disabled';
    createdAt: string;
    updatedAt: string;
};

export async function listVendors(): Promise<Vendor[]> {
    const scope = await requireTenantScope();
    const db = await getDb();

    const rows =
        scope.kind === 'global'
            ? await db.select().from(vendors).orderBy(asc(vendors.name))
            : await db
                  .select()
                  .from(vendors)
                  .where(eq(vendors.id, scope.vendorId))
                  .orderBy(asc(vendors.name));

    return rows.map(mapVendor);
}

export async function createVendor(input: { name: string; slug?: string }): Promise<Vendor> {
    const scope = await requireTenantScope();

    if (scope.kind !== 'global' || !isGlobalRole(scope.session.role)) {
        throw new Error('Only super admins can create vendors');
    }

    const db = await getDb();
    const now = new Date().toISOString();
    const id = crypto.randomUUID();
    const name = input.name.trim();
    const slug = normalizeSlug(input.slug || name);

    await db.insert(vendors).values({
        id,
        name,
        slug,
        status: 'active',
        createdAt: now,
        updatedAt: now,
    });

    return { id, name, slug, status: 'active', createdAt: now, updatedAt: now };
}

export async function ensureDefaultVendor() {
    const db = await getDb();
    const [existing] = await db
        .select({ id: vendors.id })
        .from(vendors)
        .where(eq(vendors.id, 'default'))
        .limit(1);

    if (existing) {
        return;
    }

    const now = new Date().toISOString();
    await db.insert(vendors).values({
        id: 'default',
        name: 'Default Vendor',
        slug: 'default',
        status: 'active',
        createdAt: now,
        updatedAt: now,
    });
}

function mapVendor(row: VendorRow): Vendor {
    return {
        id: row.id,
        name: row.name,
        slug: row.slug,
        status: row.status === 'disabled' ? 'disabled' : 'active',
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
    };
}

function normalizeSlug(value: string) {
    return value
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9-]+/g, '-')
        .replace(/^-+|-+$/g, '');
}
