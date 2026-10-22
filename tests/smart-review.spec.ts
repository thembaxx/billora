import { readFile } from 'node:fs/promises';
import { test, expect } from '@playwright/test';

function statementPDF() {
  const stream =
    'BT /F1 14 Tf 50 750 Td (Statement month October 2026 - Total due R 1234.50) Tj ET';
  const objects = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>',
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
    '<< /Length ' + stream.length + ' >>\nstream\n' + stream + '\nendstream',
  ];
  let body = '%PDF-1.4\n';
  const offsets = [0];
  objects.forEach((item, index) => {
    offsets.push(Buffer.byteLength(body));
    body += index + 1 + ' 0 obj\n' + item + '\nendobj\n';
  });
  const xref = Buffer.byteLength(body);
  body +=
    'xref\n0 6\n0000000000 65535 f \n' +
    offsets
      .slice(1)
      .map((offset) => String(offset).padStart(10, '0') + ' 00000 n \n')
      .join('') +
    'trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n' +
    xref +
    '\n%%EOF';
  return Buffer.from(body);
}

async function addPersonalProperty(page: import('@playwright/test').Page) {
  await page.goto('/');
  await page.getByRole('button', { name: 'Start my workspace' }).click();
  await page.getByRole('button', { name: 'Properties', exact: true }).click();
  await page.getByRole('button', { name: 'Add property', exact: true }).first().click();
  await page.getByLabel('Property name').fill('My test home');
  await page.getByLabel('Street address').fill('12 Test Road');
  await page.getByRole('button', { name: 'Add property', exact: true }).last().click();
}

async function importPDF(page: import('@playwright/test').Page) {
  await page.getByRole('button', { name: 'Statements', exact: true }).click();
  await page.getByRole('button', { name: 'Import statement', exact: true }).click();
  await page.getByLabel('Select municipal PDF').setInputFiles({
    name: 'my-bill.pdf',
    mimeType: 'application/pdf',
    buffer: statementPDF(),
  });
  await expect(page.getByRole('region', { name: 'Suggested PDF fields' })).toContainText(
    'Total due R 1234.50',
  );
  await expect(page.getByLabel('Total due (ZAR)')).toHaveValue('');
  await page.getByRole('button', { name: 'Apply suggestions for review' }).click();
  await expect(page.getByLabel('Total due (ZAR)')).toHaveValue('1234.50');
  await page.getByLabel('Payment due date').fill('2026-11-05');
  await page.getByLabel('I’ve checked the total').check();
  await page.getByRole('button', { name: 'Save reviewed statement' }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
}

test('sample records stay separate and PDF suggestions require approval', async ({ page }) => {
  await addPersonalProperty(page);
  const state = await page.evaluate(() =>
    JSON.parse(localStorage.getItem('billora-workspace') || '{}'),
  );
  expect(state.properties).toHaveLength(1);
  expect(state.statements).toHaveLength(0);
  await importPDF(page);
  const next = await page.evaluate(() =>
    JSON.parse(localStorage.getItem('billora-workspace') || '{}'),
  );
  expect(next.statements).toHaveLength(1);
  expect(next.statements[0].source).toBe('imported');
  expect(next.statements[0].period).toBe('2026-10');
  expect(next.statements[0].amount).toBe(1234.5);
});

test('only adjacent reviewed imports produce category alerts with linked query drafts', async ({
  page,
}) => {
  await page.goto('/');
  await page.evaluate(() => {
    const property = {
      id: 'mine',
      name: 'Test home',
      address: '12 Test Road',
      municipality: 'City of Tshwane',
      account: '123',
      kind: 'Home',
    };
    const record = (id: string, period: string, amount: number, electricity: number) => ({
      id,
      propertyId: 'mine',
      period,
      amount,
      dueDate: period + '-28',
      importedAt: period + '-12T00:00:00Z',
      source: 'imported',
      categoryReviewed: true,
      confidence: 'reviewed',
      categories: { electricity, water: 150, rates: 100, services: amount - electricity - 250 },
    });
    localStorage.setItem(
      'billora-workspace',
      JSON.stringify({
        properties: [property],
        statements: [record('sep', '2026-09', 1050, 700), record('oct', '2026-10', 1475, 1125)],
        requests: [],
      }),
    );
  });
  await page.reload();
  await page.getByRole('button', { name: 'Insights', exact: true }).click();
  const review = page.locator('.bill-review');
  await expect(review).toContainText('notable increases worth reviewing');
  const row = review.locator('.bill-review-row.notable').filter({ hasText: 'Electricity' });
  await expect(row).toContainText('700.00');
  await expect(row).toContainText('1,125.00');
  await row.getByRole('button', { name: 'Prepare a query' }).click();
  await expect(page.getByLabel('What happened?')).toHaveValue(/electricity.*2026-09.*2026-10/i);
  await expect(page.getByLabel('Related statement')).toHaveValue('oct');
  const requests = await page.evaluate(
    () => JSON.parse(localStorage.getItem('billora-workspace') || '{}').requests,
  );
  expect(requests).toHaveLength(1);
  expect(requests[0].status).toBe('draft');
});

test('full ZIP export restores an original PDF and request evidence', async ({ page }) => {
  await addPersonalProperty(page);
  await importPDF(page);
  await page.goto('/?requests=1');
  await page.getByRole('button', { name: 'New request', exact: true }).click();
  await page
    .getByLabel('What happened?')
    .fill('Please review the latest municipal account charge.');
  await page.getByLabel('What help would you like?').fill('Please send a written explanation.');
  await page.getByRole('button', { name: 'Continue', exact: true }).click();
  await page.getByLabel('I’m authorised to use these records').check();
  await page.getByLabel('Attach request evidence').setInputFiles({
    name: 'evidence.pdf',
    mimeType: 'application/pdf',
    buffer: Buffer.from('User supplied local evidence'),
  });
  await expect(page.locator('.request-file-list')).toContainText('evidence.pdf');
  await page.getByRole('button', { name: 'Close dialog' }).click();
  await page.getByRole('button', { name: 'Open settings' }).click();
  const saving = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Full backup (ZIP including files)' }).click();
  const archive = await saving;
  const buffer = await readFile((await archive.path())!);
  await page.getByRole('button', { name: 'Clear workspace & start fresh' }).click();
  await page.getByRole('button', { name: 'Clear workspace', exact: true }).click();
  await page.getByRole('button', { name: 'Open settings' }).click();
  await page.getByLabel('Choose a Billora full backup').setInputFiles({
    name: 'billora-complete-backup.zip',
    mimeType: 'application/zip',
    buffer,
  });
  await page.getByRole('button', { name: 'Confirm restore' }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await page.getByRole('button', { name: 'Statements', exact: true }).click();
  await page.getByRole('button', { name: 'My test home my-bill.pdf' }).click();
  const originalEvent = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Original PDF', exact: true }).click();
  expect(
    Buffer.compare(await readFile((await (await originalEvent).path())!), statementPDF()),
  ).toBe(0);
  await page.goto('/?requests=1');
  await page.locator('.request-list li button').first().click();
  await expect(page.getByRole('dialog')).toContainText('evidence.pdf');
});
