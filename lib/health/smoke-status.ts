import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

import { getCloudflareContext } from '@opennextjs/cloudflare';

export type SmokeStatus = {
    status: string;
    label?: string;
    recordedAt?: string;
};

const DEFAULT_MAX_AGE_SECONDS = 24 * 60 * 60;
const DEFAULT_SMOKE_STATUS_FILE = '/tmp/digsign-smoke-status.json';
const LEGACY_SMOKE_STATUS_FILE = '/tmp/rtvplanner-smoke-status.json';
const KV_KEY = 'smoke:status';

type SmokeEnv = Record<string, string | undefined>;

interface KvLike {
    get(key: string, type: 'json'): Promise<unknown>;
    put(key: string, value: string): Promise<void>;
}

interface SmokeKvEnv {
    SLIDE_DATA_KV?: KvLike;
}

export async function readSmokeStatus(env: SmokeEnv = process.env): Promise<SmokeStatus | null> {
    const inlineStatus = smokeEnv(env, 'DIGSIGN_LAST_SMOKE_STATUS', 'RTV_LAST_SMOKE_STATUS');

    if (inlineStatus) {
        const label = smokeEnv(env, 'DIGSIGN_LAST_SMOKE_LABEL', 'RTV_LAST_SMOKE_LABEL');
        const recordedAt = smokeEnv(env, 'DIGSIGN_LAST_SMOKE_AT', 'RTV_LAST_SMOKE_AT');

        return {
            status: inlineStatus,
            ...(label ? { label } : {}),
            ...(recordedAt ? { recordedAt } : {}),
        };
    }
    const fromKv = await readFromKv();

    if (fromKv) {
        return fromKv;
    }

    return readFromFile(env);
}

export async function writeSmokeStatus(
    status: SmokeStatus,
    env: SmokeEnv = process.env,
): Promise<void> {
    const wroteToKv = await writeToKv(status);

    if (wroteToKv) {
        return;
    }
    writeToFile(status, env);
}

export function smokeStatusMessage(smoke: SmokeStatus, env: SmokeEnv = process.env) {
    const label = smoke.label ? `${smoke.label}: ` : '';

    if (isSmokeStatusStale(smoke, env)) {
        return `${label}latest smoke status is stale`;
    }

    return `${label}latest smoke status is ${smoke.status}`;
}

export function isSmokeStatusOk(smoke: SmokeStatus, env: SmokeEnv = process.env) {
    return smoke.status === 'ok' && !isSmokeStatusStale(smoke, env);
}

export function isSmokeStatusStale(smoke: SmokeStatus, env: SmokeEnv = process.env) {
    if (!smoke.recordedAt) {
        return false;
    }
    const recorded = Date.parse(smoke.recordedAt);

    if (!Number.isFinite(recorded)) {
        return true;
    }
    const maxAgeSeconds = Number(
        smokeEnv(env, 'DIGSIGN_SMOKE_MAX_AGE_SECONDS', 'RTV_SMOKE_MAX_AGE_SECONDS') ||
            DEFAULT_MAX_AGE_SECONDS,
    );
    const maxAge =
        Number.isFinite(maxAgeSeconds) && maxAgeSeconds > 0
            ? maxAgeSeconds
            : DEFAULT_MAX_AGE_SECONDS;

    return Date.now() - recorded > maxAge * 1000;
}

async function resolveKv(): Promise<KvLike | null> {
    try {
        const ctx = await getCloudflareContext({ async: true });
        const env = ctx.env as unknown as SmokeKvEnv;

        return env.SLIDE_DATA_KV ?? null;
    } catch {
        return null;
    }
}

async function readFromKv(): Promise<SmokeStatus | null> {
    const kv = await resolveKv();

    if (!kv) {
        return null;
    }

    try {
        const cached = (await kv.get(KV_KEY, 'json')) as SmokeStatus | null;

        return cached && typeof cached.status === 'string' ? cached : null;
    } catch (error) {
        console.warn('[smoke-status] kv read failed', error);

        return null;
    }
}

async function writeToKv(status: SmokeStatus): Promise<boolean> {
    const kv = await resolveKv();

    if (!kv) {
        return false;
    }

    try {
        await kv.put(KV_KEY, JSON.stringify(status));

        return true;
    } catch (error) {
        console.warn('[smoke-status] kv write failed', error);

        return false;
    }
}

function readFromFile(env: SmokeEnv): SmokeStatus | null {
    const path = smokeStatusPath(env);

    if (!existsSync(path)) {
        const legacyPath = resolve(process.cwd(), LEGACY_SMOKE_STATUS_FILE);

        if (legacyPath !== path && existsSync(legacyPath)) {
            return readStatusFile(legacyPath);
        }

        return null;
    }

    return readStatusFile(path);
}

function writeToFile(status: SmokeStatus, env: SmokeEnv): void {
    const path = smokeStatusPath(env);
    mkdirSync(dirname(path), { recursive: true });
    writeFileSync(path, `${JSON.stringify(status, null, 2)}\n`);
}

function smokeStatusPath(env: SmokeEnv) {
    return resolve(
        process.cwd(),
        smokeEnv(env, 'DIGSIGN_SMOKE_STATUS_FILE', 'RTV_SMOKE_STATUS_FILE') ||
            DEFAULT_SMOKE_STATUS_FILE,
    );
}

function readStatusFile(path: string) {
    try {
        const parsed = JSON.parse(readFileSync(path, 'utf8')) as SmokeStatus;

        return typeof parsed.status === 'string' ? parsed : null;
    } catch {
        return null;
    }
}

function smokeEnv(env: SmokeEnv, primary: string, legacy: string) {
    return env[primary] ?? env[legacy];
}
