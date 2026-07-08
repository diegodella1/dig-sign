import { expect, test } from '@playwright/test';
import { createHash } from 'node:crypto';

test.setTimeout(60_000);

const e2eOperator = {
    handle: 'qa-e2e',
    displayName: 'QA E2E',
    token: 'qa-e2e-token-2026',
};

test.beforeAll(async () => {
    await upsertE2eOperator();
});

test('named operator can log in and reach the dashboard', async ({ page }) => {
    test.skip(!canSeedOperator(), 'requires Supabase service role env');
    await page.goto('/admin/login', { waitUntil: 'domcontentloaded' });
    await page.getByRole('textbox', { name: /operator handle/i }).fill(e2eOperator.handle);
    await page.getByRole('textbox', { name: 'Token', exact: true }).fill(e2eOperator.token);
    await page.getByRole('button', { name: /sign in|login|ingresar/i }).click();
    await expect(page).toHaveURL(/\/admin\/screens/);
    await page.goto('/admin', { waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('main')).toBeVisible();
});

test.describe('authenticated admin flows', () => {
    test.beforeEach(async ({ page, baseURL }) => {
        test.skip(!process.env.ADMIN_BOOTSTRAP_TOKEN, 'requires ADMIN_BOOTSTRAP_TOKEN');
        await page.context().addCookies([
            {
                name: 'rpm_admin_token',
                value: process.env.ADMIN_BOOTSTRAP_TOKEN!,
                url: baseURL ?? 'http://127.0.0.1:3451',
                httpOnly: true,
                sameSite: 'Lax',
            },
        ]);
    });

    test('operator can open core production pages', async ({ page }) => {
        for (const path of [
            '/admin/assets',
            '/admin/vimeo',
            '/admin/screens',
            '/admin/playlists',
            '/admin/operate',
            '/admin/health',
        ]) {
            await page.goto(path, { waitUntil: 'domcontentloaded' });
            await expect(page.getByRole('main')).toBeVisible();
        }
    });

    test('operate page exposes monitor surfaces', async ({ page }) => {
        await page.goto('/admin/operate');
        await expect(page.getByText(/Screen monitor|Monitor/i).first()).toBeVisible();
    });

    test('admin health reports integration readiness', async ({ page }) => {
        await page.goto('/admin/health');
        await expect(page.getByText(/Database|Supabase/i).first()).toBeVisible();
        await expect(page.getByText(/Storage/i).first()).toBeVisible();
        await expect(page.getByText(/Vimeo/i).first()).toBeVisible();
        await expect(page.getByText(/Output/i).first()).toBeVisible();
    });
});

function canSeedOperator() {
    return Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY && process.env.NEXT_PUBLIC_SUPABASE_URL);
}

async function upsertE2eOperator() {
    if (!canSeedOperator()) {
        return;
    }

    const tokenHash = createHash('sha256').update(e2eOperator.token).digest('hex');
    const url = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/admin_operators?on_conflict=handle`;
    const response = await fetch(url, {
        method: 'POST',
        headers: {
            apikey: process.env.SUPABASE_SERVICE_ROLE_KEY!,
            Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY!}`,
            'Content-Type': 'application/json',
            Prefer: 'resolution=merge-duplicates',
        },
        body: JSON.stringify({
            handle: e2eOperator.handle,
            display_name: e2eOperator.displayName,
            role: 'operator',
            token_hash: tokenHash,
            status: 'active',
        }),
    });

    if (!response.ok) {
        throw new Error(`Failed to seed e2e operator: ${response.status}`);
    }
}
