import { defineConfig } from '@playwright/test';
import { loadEnvConfig } from '@next/env';

loadEnvConfig(process.cwd());

function smokeEnv(primary: string, legacy: string) {
    return process.env[primary] ?? process.env[legacy];
}

const e2ePort = smokeEnv('DIGSIGN_E2E_PORT', 'RTV_E2E_PORT') ?? '3451';
const e2eBaseURL = smokeEnv('DIGSIGN_BASE_URL', 'RTV_BASE_URL') ?? `http://127.0.0.1:${e2ePort}`;
const webServer = smokeEnv('DIGSIGN_BASE_URL', 'RTV_BASE_URL')
    ? {}
    : {
          webServer: {
              command: `./node_modules/.bin/next dev -p ${e2ePort}`,
              url: e2eBaseURL,
              reuseExistingServer: !process.env.CI,
              timeout: 120_000,
          },
      };

export default defineConfig({
    testDir: './e2e',
    testMatch: /.*\.spec\.ts/,
    timeout: 30_000,
    expect: {
        timeout: 10_000,
    },
    use: {
        baseURL: e2eBaseURL,
        screenshot: 'only-on-failure',
        trace: 'retain-on-failure',
    },
    ...webServer,
    reporter: [['list']],
});
