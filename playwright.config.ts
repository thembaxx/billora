import { defineConfig } from '@playwright/test';
import { existsSync } from 'node:fs';
const port = Number(process.env.BILLORA_TEST_PORT || 4173);
export default defineConfig({
  testDir: './tests',
  fullyParallel: false,
  workers: 1,
  timeout: 45000,
  use: {
    baseURL: `http://127.0.0.1:${port}`,
    headless: true,
    launchOptions: {
      executablePath: existsSync('/usr/bin/chromium') ? '/usr/bin/chromium' : undefined,
      args: ['--no-sandbox', '--enable-unsafe-swiftshader'],
    },
    viewport: { width: 1440, height: 1000 },
  },
  webServer: {
    command: `npm run preview -- --port ${port} --strictPort`,
    url: `http://127.0.0.1:${port}`,
    reuseExistingServer: !process.env.CI,
  },
});
