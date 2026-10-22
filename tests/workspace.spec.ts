import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

function statementPDF() {
  const stream =
    'BT /F1 14 Tf 50 750 Td (Municipal statement October 2026 - Total due R 1234.50) Tj ET';
  const objects = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>',
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
    `<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`,
  ];
  let body = '%PDF-1.4\n';
  const offsets = [0];
  objects.forEach((o, i) => {
    offsets.push(Buffer.byteLength(body));
    body += `${i + 1} 0 obj\n${o}\nendobj\n`;
  });
  const xref = Buffer.byteLength(body);
  body += `xref\n0 6\n0000000000 65535 f \n${offsets
    .slice(1)
    .map((n) => String(n).padStart(10, '0') + ' 00000 n \n')
    .join('')}trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`;
  return Buffer.from(body);
}

test('property → reviewed PDF → original download → reminder and payment note persist', async ({
  page,
}) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('/?view=properties');
  await page.getByRole('button', { name: 'Add property', exact: true }).click();
  await page.getByLabel('Property name').fill('Cape Town studio');
  await page.getByLabel('Street address').fill('12 Loop Street, Cape Town');
  await page
    .getByRole('combobox', { name: 'Municipality', exact: true })
    .selectOption('City of Cape Town');
  await page.getByRole('button', { name: 'Add property', exact: true }).last().click();
  await expect(page.getByRole('heading', { name: 'Cape Town studio' })).toBeVisible();
  await page.getByRole('button', { name: 'Statements', exact: true }).click();
  await page.getByRole('button', { name: 'Import statement', exact: true }).click();
  await page.getByLabel('Select municipal PDF').setInputFiles({
    name: 'october-statement.pdf',
    mimeType: 'application/pdf',
    buffer: statementPDF(),
  });
  await expect(page.getByText('Text extracted on your device.', { exact: false })).toBeVisible();
  await page
    .getByRole('dialog')
    .getByRole('combobox', { name: 'Property', exact: true })
    .selectOption({ label: 'Cape Town studio' });
  await page.getByLabel('Statement month').fill('2026-10');
  await page.getByLabel('Payment due date').fill('2026-11-05');
  await page.getByLabel('Total due (ZAR)').fill('1234.50');
  await page.getByLabel('I’ve checked the total').check();
  await page.getByRole('button', { name: 'Save reviewed statement' }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await page.reload();
  await page.getByRole('button', { name: 'Cape Town studio october-statement.pdf' }).click();
  await expect(page.getByRole('dialog')).toContainText('1,234.50');
  const originalPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Original PDF', exact: true }).click();
  const original = await originalPromise;
  expect(original.suggestedFilename()).toBe('october-statement.pdf');
  const reminderPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Add reminder' }).click();
  const reminder = await reminderPromise;
  expect(reminder.suggestedFilename()).toContain('2026-11-05.ics');
  await expect(
    page.getByRole('link', { name: 'Pay on official municipal portal' }),
  ).toHaveAttribute('href', 'https://eservices.capetown.gov.za/');
  await page.getByRole('button', { name: 'Mark as paid for my own records' }).click();
  await expect(page.getByRole('button', { name: 'Personally marked as paid' })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  await page.getByRole('button', { name: 'Close dialog' }).click();
  await page.reload();
  await page.getByRole('button', { name: 'Cape Town studio october-statement.pdf' }).click();
  await expect(page.getByRole('button', { name: 'Personally marked as paid' })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  expect(errors).toEqual([]);
});

test('theme, privacy, keyboard navigation, onboarding and data controls', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Open settings' }).click();
  await page.getByRole('button', { name: 'Dark', exact: true }).click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await page.getByRole('switch', { name: 'Hide balances' }).click();
  await page.getByRole('switch', { name: 'Gentler motion' }).click();
  await page.getByRole('button', { name: 'Close dialog' }).click();
  await expect(page.locator('.balance-amount')).toContainText('•••••');
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await expect(page.locator('html')).toHaveAttribute('data-motion', 'reduced');
  await page.keyboard.press('Control+k');
  await page.getByLabel('Search workspace').fill('Tshwane');
  await expect(page.getByRole('dialog')).toContainText('The Pretoria apartment');
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await page.getByRole('button', { name: 'Take a quick look' }).click();
  await page.getByRole('button', { name: 'A little more' }).click();
  await page.getByRole('button', { name: 'A little more' }).click();
  await expect(page.getByRole('dialog')).toContainText('Your data stays in this browser');
  await page.getByRole('button', { name: 'Make yourself at home' }).click();
  await expect(page.locator('.welcome-strip')).toHaveCount(0);
});

test('install manifest and offline reload preserve the workspace', async ({ page, context }) => {
  await page.goto('/');
  const manifest = await (await page.request.get('/manifest.webmanifest')).json();
  expect(manifest.display).toBe('standalone');
  expect(manifest.icons.some((i: { purpose: string }) => i.purpose === 'maskable')).toBeTruthy();
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
  });
  await expect
    .poll(() => page.evaluate(() => navigator.serviceWorker.controller !== null))
    .toBe(true);
  await context.setOffline(true);
  await page.reload();
  await expect(page.getByRole('heading', { level: 1 })).toContainText('A little clarity.');
  await expect(
    page.getByText('You’re offline. Your saved statements are still right here.'),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Statements', exact: true }).click();
  await expect(page.locator('tbody tr')).toHaveCount(12);
});

test('responsive screens have no horizontal overflow, with accessible controls', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  for (const width of [320, 390, 768, 1024, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    for (const name of ['Overview', 'Properties', 'Statements', 'Insights']) {
      await page.getByRole('button', { name, exact: true }).click();
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
      expect(
        await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
        `${name} at ${width}px`,
      ).toBe(true);
    }
  }
  await page.getByRole('button', { name: 'Overview', exact: true }).click();
  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
    .analyze();
  expect(
    results.violations.map((v) => ({ id: v.id, nodes: v.nodes.map((n) => n.target) })),
  ).toEqual([]);
  await page.getByRole('button', { name: 'Open settings' }).click();
  const dialogResults = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
    .analyze();
  expect(
    dialogResults.violations.map((v) => ({ id: v.id, nodes: v.nodes.map((n) => n.target) })),
  ).toEqual([]);
});
