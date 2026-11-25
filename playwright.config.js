import {env} from 'node:process';
import {defineConfig} from '@playwright/test';

const port = 1337;

export default defineConfig({
    testDir: './e2e',
    reporter: 'list',
    use: {
        baseURL: `http://localhost:${port}`,
    },
    webServer: {
        command: 'node bin/dword.js package.json',
        port,
        env: {
            PORT: String(port),
        },
        reuseExistingServer: !env.CI,
    },
});
