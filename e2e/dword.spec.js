import {test, expect} from '@playwright/test';

test('dword: global is a function', async ({page}) => {
    await page.goto('/');

    const type = await page.evaluate(() => typeof globalThis.dword);

    expect(type).toBe('function');
});

test('dword: CodeMirror global is a function', async ({page}) => {
    await page.goto('/');
    await expect(page.locator('.CodeMirror')).toBeVisible();

    const type = await page.evaluate(() => typeof globalThis.CodeMirror);

    expect(type).toBe('function');
});

test('dword: editor is shown without errors', async ({page}) => {
    const errors = [];

    page.on('pageerror', ({message}) => {
        errors.push(message);
    });

    await page.goto('/');
    await expect(page.locator('.CodeMirror')).toBeVisible();

    expect(errors).toEqual([]);
});

test('dword: file content is shown', async ({page}) => {
    await page.goto('/');
    await expect(page.locator('.CodeMirror-code')).toContainText(/"name":.+"dword"/);
});
