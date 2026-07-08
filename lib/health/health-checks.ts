import { listScreens } from '../screens';
import { getVimeoSettings, getVimeoToken } from '../settings';
import {
    isSmokeStatusOk,
    isSmokeStatusStale,
    readSmokeStatus,
    smokeStatusMessage,
} from './smoke-status';
import { getDb } from '../db/client';
import { getMediaBucket } from '../storage/r2';
import {
    adminOperators,
    mediaAssets,
    operatorPreferences,
    screens,
    slideAssets,
} from '../db/schema';

type VimeoSettings = Awaited<ReturnType<typeof getVimeoSettings>>;
type VimeoToken = Awaited<ReturnType<typeof getVimeoToken>>;
type SettingsResult<T> = { ok: true; value: T } | { ok: false; error: unknown };

export type CollectOperatorHealthOptions = {
    /** @deprecated Schedule-era preload. Ignored. */
    preloadedLiveSchedule?: unknown;
};

async function safeSettings<T>(loader: () => Promise<T>): Promise<SettingsResult<T>> {
    try {
        return { ok: true, value: await loader() };
    } catch (error) {
        return { ok: false, error };
    }
}

export type OperatorHealthStatus = 'ok' | 'degraded' | 'fail';

export type OperatorHealthCheck = {
    id:
        | 'env'
        | 'supabase'
        | 'schema'
        | 'storage'
        | 'vimeo'
        | 'output'
        | 'migrations'
        | 'smoke';
    label: string;
    ok: boolean;
    status: OperatorHealthStatus;
    message: string;
    href?: string;
};

export type OperatorHealthReport = {
    ok: boolean;
    status: OperatorHealthStatus;
    service: 'dig-sign';
    generatedAt: string;
    uptime: number;
    checks: Record<OperatorHealthCheck['id'], OperatorHealthCheck>;
};

export function sanitizeOperatorHealthReport(report: OperatorHealthReport): OperatorHealthReport {
    const checks = Object.fromEntries(
        Object.entries(report.checks).map(([id, check]) => [
            id,
            {
                id: check.id,
                label: check.label,
                ok: check.ok,
                status: check.status,
                message: publicHealthMessage(check.status),
            },
        ]),
    ) as OperatorHealthReport['checks'];

    return { ...report, checks };
}

export async function collectOperatorHealth(): Promise<OperatorHealthReport> {
    const [vimeoSettings, vimeoToken] = await Promise.all([
        safeSettings(getVimeoSettings),
        safeSettings(getVimeoToken),
    ]);
    const [supabase, schema, storage, vimeo, output, migrations, smoke] = await Promise.all([
        checkSupabase(),
        checkSchema(),
        checkStorage(),
        checkVimeo(vimeoSettings, vimeoToken),
        checkOutput(),
        checkMigrations(),
        checkSmoke(),
    ]);
    const checks = {
        env: checkEnv(),
        supabase,
        schema,
        storage,
        vimeo,
        output,
        migrations,
        smoke,
    } satisfies OperatorHealthReport['checks'];
    const ok = Object.values(checks).every((check) => check.ok);
    const degraded = ok && Object.values(checks).some((check) => check.status === 'degraded');

    return {
        ok,
        status: ok ? (degraded ? 'degraded' : 'ok') : 'fail',
        service: 'dig-sign',
        generatedAt: new Date().toISOString(),
        uptime: Math.round(process.uptime()),
        checks,
    };
}

function checkEnv(): OperatorHealthCheck {
    const missing = [
        'APP_ENCRYPTION_KEY',
        'ADMIN_BOOTSTRAP_TOKEN',
        ...(process.env.NODE_ENV === 'production' ? ['OUTPUT_CAPTURE_TOKEN'] : []),
    ].filter((key) => !process.env[key]);

    if (
        process.env.ALLOW_DEMO_DATA === 'true' &&
        (process.env.NODE_ENV === 'production' ||
            process.env.APP_BASE_URL?.startsWith('https://') ||
            process.env.NEXT_PUBLIC_APP_BASE_URL?.startsWith('https://'))
    ) {
        return fail('env', 'Environment', 'ALLOW_DEMO_DATA cannot be enabled in production');
    }

    return missing.length
        ? fail('env', 'Environment', `Missing required env: ${missing.join(', ')}`)
        : pass('env', 'Environment', 'Required environment is configured');
}

async function checkSupabase(): Promise<OperatorHealthCheck> {
    try {
        const db = await getDb();

        await db.select({ id: mediaAssets.id }).from(mediaAssets).limit(1);

        return pass('supabase', 'Database', 'D1 database query succeeded');
    } catch (error) {
        return fail('supabase', 'Database', `D1 database unavailable: ${errorMessage(error)}`);
    }
}

async function checkSchema(): Promise<OperatorHealthCheck> {
    try {
        const db = await getDb();

        await Promise.all([
            db
                .select({
                    id: mediaAssets.id,
                    playbackReadinessStatus: mediaAssets.playbackReadinessStatus,
                    playbackCheckedAt: mediaAssets.playbackCheckedAt,
                    playbackError: mediaAssets.playbackError,
                })
                .from(mediaAssets)
                .limit(1),
            db
                .select({
                    id: slideAssets.id,
                    templateId: slideAssets.templateId,
                    metadata: slideAssets.metadata,
                })
                .from(slideAssets)
                .limit(1),
        ]);

        return pass('schema', 'Schema', 'Required D1 tables and columns present');
    } catch (error) {
        return degraded('schema', 'Schema', `Schema drift detected: ${errorMessage(error)}`);
    }
}

async function checkStorage(): Promise<OperatorHealthCheck> {
    try {
        const bucket = await getMediaBucket();
        await bucket.list({ limit: 1 });

        return pass('storage', 'Storage', 'R2 bucket reachable');
    } catch (error) {
        return fail('storage', 'Storage', `Storage check failed: ${errorMessage(error)}`);
    }
}

async function checkVimeo(
    settingsResult: SettingsResult<VimeoSettings>,
    tokenResult: SettingsResult<VimeoToken>,
): Promise<OperatorHealthCheck> {
    if (!settingsResult.ok) {
        return degraded(
            'vimeo',
            'Vimeo',
            `Vimeo check failed: ${errorMessage(settingsResult.error)}`,
        );
    }

    if (!tokenResult.ok) {
        return degraded('vimeo', 'Vimeo', `Vimeo check failed: ${errorMessage(tokenResult.error)}`);
    }
    const settings = settingsResult.value;
    const token = tokenResult.value;

    if (!token) {
        return degraded('vimeo', 'Vimeo', 'Vimeo token not configured', '/admin/settings');
    }

    if (settings?.status === 'failed' || settings?.status === 'invalid') {
        return degraded('vimeo', 'Vimeo', settings.lastError ?? `Status: ${settings.status}`);
    }

    return pass('vimeo', 'Vimeo', settings?.lastError ?? 'Vimeo token configured');
}

async function checkOutput(): Promise<OperatorHealthCheck> {
    if (!process.env.OUTPUT_CAPTURE_TOKEN) {
        return fail('output', 'Output', 'OUTPUT_CAPTURE_TOKEN missing', '/admin/screens');
    }

    try {
        const screens = await listScreens();

        return screens.length
            ? pass('output', 'Output', `${screens.length} screen(s) configured`, '/admin/screens')
            : degraded('output', 'Output', 'No screens configured', '/admin/screens');
    } catch (error) {
        return fail(
            'output',
            'Output',
            `Output check failed: ${errorMessage(error)}`,
            '/admin/screens',
        );
    }
}

async function checkMigrations(): Promise<OperatorHealthCheck> {
    try {
        const db = await getDb();

        await Promise.all([
            db.select({ id: adminOperators.id }).from(adminOperators).limit(1),
            db
                .select({
                    operatorId: operatorPreferences.operatorId,
                    key: operatorPreferences.key,
                    value: operatorPreferences.value,
                })
                .from(operatorPreferences)
                .limit(1),
            db.select({ id: screens.id, slug: screens.slug }).from(screens).limit(1),
        ]);

        return pass('migrations', 'Migrations', 'D1 ops readiness tables are available');
    } catch (error) {
        return fail(
            'migrations',
            'Migrations',
            `D1 ops readiness migration missing or invalid: ${errorMessage(error)}`,
        );
    }
}

async function checkSmoke(): Promise<OperatorHealthCheck> {
    const smoke = await readSmokeStatus();

    if (!smoke) {
        return degraded('smoke', 'Smoke', 'No recent smoke status configured');
    }

    if (smoke.status === 'ok' && isSmokeStatusStale(smoke)) {
        return degraded('smoke', 'Smoke', smokeStatusMessage(smoke));
    }

    return isSmokeStatusOk(smoke)
        ? pass('smoke', 'Smoke', smokeStatusMessage(smoke))
        : fail('smoke', 'Smoke', smokeStatusMessage(smoke));
}

function pass(
    id: OperatorHealthCheck['id'],
    label: string,
    message: string,
    href?: string,
): OperatorHealthCheck {
    return href
        ? { id, label, ok: true, status: 'ok', message, href }
        : { id, label, ok: true, status: 'ok', message };
}

function degraded(
    id: OperatorHealthCheck['id'],
    label: string,
    message: string,
    href?: string,
): OperatorHealthCheck {
    return href
        ? { id, label, ok: true, status: 'degraded', message, href }
        : { id, label, ok: true, status: 'degraded', message };
}

function fail(
    id: OperatorHealthCheck['id'],
    label: string,
    message: string,
    href?: string,
): OperatorHealthCheck {
    return href
        ? { id, label, ok: false, status: 'fail', message, href }
        : { id, label, ok: false, status: 'fail', message };
}

function errorMessage(error: unknown) {
    if (error instanceof Error) {
        return error.message;
    }

    if (typeof error === 'object' && error !== null && 'message' in error) {
        return String((error as { message: unknown }).message);
    }

    return String(error);
}

function publicHealthMessage(status: OperatorHealthStatus) {
    if (status === 'ok') {
        return 'Check passed';
    }

    if (status === 'degraded') {
        return 'Check degraded';
    }

    return 'Check failed';
}
