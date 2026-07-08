import { eq } from 'drizzle-orm';

import {
    getCurrentOperatorSession,
    requireAdmin,
    type OperatorRole,
    type OperatorSession,
} from './auth';

import type { SQLiteColumn } from 'drizzle-orm/sqlite-core';

export type TenantScope =
    | {
          kind: 'global';
          vendorId: null;
          session: OperatorSession;
      }
    | {
          kind: 'vendor';
          vendorId: string;
          session: OperatorSession;
      };

export type ScopedRole = OperatorRole | 'super_admin' | 'vendor_admin';

export async function requireTenantScope(): Promise<TenantScope> {
    const session = await requireAdmin();

    return scopeForSession(session);
}

export async function tenantScopeOrGlobal(): Promise<TenantScope | null> {
    const session = await getCurrentOperatorSession();

    return session ? scopeForSession(session) : null;
}

function scopeForSession(session: OperatorSession): TenantScope {
    if (isGlobalRole(session.role) && !session.vendorId) {
        return { kind: 'global', vendorId: null, session };
    }

    if (!session.vendorId) {
        throw new Error('Operator is missing vendor assignment');
    }

    return { kind: 'vendor', vendorId: session.vendorId, session };
}

export function tenantWhere<TColumn extends SQLiteColumn>(
    column: TColumn,
    scope: TenantScope | null,
): ReturnType<typeof eq> | undefined {
    return scope?.kind === 'vendor' ? eq(column, scope.vendorId) : undefined;
}

export function tenantValue(scope: TenantScope) {
    return scope.kind === 'vendor' ? scope.vendorId : 'default';
}

export function isGlobalRole(role: string) {
    return role === 'super_admin' || role === 'admin';
}

export function isVendorRole(role: string) {
    return role === 'vendor_admin' || role === 'operator';
}
