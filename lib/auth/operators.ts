import crypto from 'node:crypto';

import { asc, eq } from 'drizzle-orm';

import { auditedMutation } from '../audit/audit';
import { hashSecret } from './auth';
import { isGlobalRole, requireTenantScope } from './tenancy';
import { adminOperators } from '../db/schema';
import { getDb } from '../db/client';

export type AdminOperator = {
    id: string;
    handle: string;
    vendorId: string | null;
    displayName: string;
    role: 'super_admin' | 'admin' | 'vendor_admin' | 'operator';
    status: 'active' | 'disabled';
};

export async function listOperators(): Promise<AdminOperator[]> {
    const scope = await requireTenantScope();
    const db = await getDb();
    const rows = await db
        .select({
            id: adminOperators.id,
            handle: adminOperators.handle,
            vendorId: adminOperators.vendorId,
            displayName: adminOperators.displayName,
            role: adminOperators.role,
            status: adminOperators.status,
        })
        .from(adminOperators)
        .where(scope.kind === 'vendor' ? eq(adminOperators.vendorId, scope.vendorId) : undefined)
        .orderBy(asc(adminOperators.handle));

    return rows.map((row) => ({
        id: row.id,
        handle: row.handle,
        vendorId: row.vendorId,
        displayName: row.displayName,
        role: row.role as AdminOperator['role'],
        status: row.status as AdminOperator['status'],
    }));
}

export async function createOperator(input: {
    handle: string;
    displayName: string;
    role: string;
    vendorId?: string | null;
    token?: string;
}) {
    const scope = await requireTenantScope();
    const handle = input.handle.trim().toLowerCase();
    const displayName = input.displayName.trim() || handle;
    const role = normalizeOperatorRole(input.role, scope.kind === 'global');
    const vendorId =
        scope.kind === 'vendor'
            ? scope.vendorId
            : role === 'super_admin'
              ? null
              : input.vendorId || null;
    const token = input.token?.trim() || crypto.randomBytes(18).toString('base64url');

    if (scope.kind === 'vendor' && role === 'super_admin') {
        throw new Error('Vendors cannot create super admins');
    }

    if (scope.kind === 'global' && role !== 'super_admin' && !vendorId) {
        throw new Error('Vendor users must be assigned to a vendor');
    }

    if (!/^[a-z0-9._-]{2,80}$/.test(handle)) {
        throw new Error(
            'Operator handle must use lowercase letters, numbers, dot, dash or underscore',
        );
    }
    const db = await getDb();
    await auditedMutation(
        {
            action: 'admin_operator.created',
            entityType: 'admin_operators',
            entityId: handle,
            next: { handle, display_name: displayName, role, vendor_id: vendorId },
        },
        async () => {
            await db
                .insert(adminOperators)
                .values({
                    handle,
                    vendorId,
                    displayName,
                    role,
                    tokenHash: hashSecret(token),
                    status: 'active',
                    updatedAt: new Date().toISOString(),
                })
                .onConflictDoUpdate({
                    target: adminOperators.handle,
                    set: {
                        vendorId,
                        displayName,
                        role,
                        tokenHash: hashSecret(token),
                        status: 'active',
                        updatedAt: new Date().toISOString(),
                    },
                });
        },
    );

    return { handle, token };
}

function normalizeOperatorRole(role: string, globalScope: boolean): AdminOperator['role'] {
    if (globalScope && isGlobalRole(role)) {
        return 'super_admin';
    }

    if (role === 'vendor_admin' || role === 'admin') {
        return 'vendor_admin';
    }

    return 'operator';
}
