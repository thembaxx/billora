import { test, expect, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { readFile } from 'node:fs/promises';
import { strFromU8, strToU8, unzipSync, zipSync } from 'fflate';

function statementPDF(month: string, amount: string) {
  const stream = `BT /F1 14 Tf 50 750 Td (Statement month ${month} 2026 - Total due R ${amount}) Tj ET`;
  const objects = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>',
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
    `<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`,
  ];
  let body = '%PDF-1.4\n';
  const offsets = [0];
  objects.forEach((item, i) => {
    offsets.push(Buffer.byteLength(body));
    body += `${i + 1} 0 obj\n${item}\nendobj\n`;
  });
  const xref = Buffer.byteLength(body);
  body +=
    'xref\n0 6\n0000000000 65535 f \n' +
    offsets
      .slice(1)
      .map((n) => `${String(n).padStart(10, '0')} 00000 n \n`)
      .join('') +
    `trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`;
  return Buffer.from(body);
}
const september = statementPDF('September', '1000.00');
const october = statementPDF('October', '1500.00');

async function startImport(page: Page) {
  await page.goto('/?import=1');
  await page.getByRole('button', { name: 'Add a property', exact: true }).click();
  await page.getByLabel('Property name').fill('Evidence test home');
  await page.getByLabel('Street address').fill('12 Example Road');
  await page.getByRole('button', { name: 'Add property', exact: true }).click();
  await expect(page.getByLabel('Select municipal PDF')).toBeAttached();
}
async function upload(page: Page, buffer: Buffer, name: string) {
  await page
    .getByLabel('Select municipal PDF')
    .setInputFiles({ name, mimeType: 'application/pdf', buffer });
  await expect(page.getByRole('button', { name: 'Apply suggestions for review' })).toBeVisible({
    timeout: 15000,
  });
  await page.getByRole('button', { name: 'Apply suggestions for review' }).click();
  await page.getByLabel('Payment due date').fill('2026-11-05');
  await page.getByLabel('I’ve checked the total').check();
}
async function save(page: Page) {
  await page.getByRole('button', { name: 'Save reviewed statement' }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
}

// Real UI imports, local persistence and actual downloaded archive contents are the proof.
test('two reviewed imports produce a query pack containing both original bills and comparison figures', async ({
  page,
  context,
}) => {
  test.setTimeout(90000);
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await startImport(page);
  await upload(page, september, 'september.pdf');
  await expect(page.getByRole('link', { name: /Open original PDF for review/ })).toHaveAttribute(
    'href',
    /^blob:/,
  );
  await save(page);
  await page.getByRole('button', { name: 'Import statement', exact: true }).click();
  await upload(page, october, 'october.pdf');
  await save(page);
  await page.reload();
  await page.getByRole('button', { name: 'Insights', exact: true }).click();
  const comparison = page.locator('.bill-review-row.notable').filter({ hasText: 'Total bill' });
  await expect(comparison).toContainText('50.0% increase');
  await comparison.getByRole('button', { name: 'Prepare a query' }).click();
  await expect(page.getByText('Comparison evidence:', { exact: false })).toContainText(
    '2026-09 → 2026-10',
  );
  await page.getByRole('button', { name: 'Continue', exact: true }).click();
  await page.getByLabel('I’m authorised to use these records').check();
  await page.getByRole('button', { name: 'Continue', exact: true }).click();
  await expect(page.getByRole('region', { name: 'Draft letter preview' })).toContainText(
    'Previous statement: 2026-09',
  );
  await page.getByLabel('I’ve reviewed the details and evidence.').check();
  await page.getByRole('button', { name: 'Mark ready for submission' }).click();
  await context.setOffline(true);
  const downloading = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Download request pack' }).click();
  const files = unzipSync(await readFile((await (await downloading).path())!));
  expect(Buffer.from(files['evidence/00-october.pdf'])).toEqual(october);
  expect(Buffer.from(files['evidence/previous-september.pdf'])).toEqual(september);
  expect(JSON.parse(strFromU8(files['comparison.json']))).toMatchObject({
    before: 1000,
    after: 1500,
    difference: 500,
    billingErrorConfirmed: false,
  });
  expect(strFromU8(files['request-draft.txt'])).toContain('not been sent by Billora');
  await context.setOffline(false);
  // Removing a library bill must preserve originals still linked to a query.
  await page.getByRole('button', { name: 'Close dialog' }).click();
  await page.getByRole('button', { name: 'Statements', exact: true }).click();
  await page.getByRole('button', { name: 'Evidence test home september.pdf' }).click();
  await page.getByRole('button', { name: 'Remove statement', exact: true }).click();
  await page.evaluate(() => {
    const originalSet = Storage.prototype.setItem;
    let fail = true;
    Storage.prototype.setItem = function (key, value) {
      if (key === 'billora-workspace' && fail) {
        fail = false;
        throw new DOMException('Simulated full device', 'QuotaExceededError');
      }
      return originalSet.call(this, key, value);
    };
  });
  await page.getByRole('button', { name: 'Remove statement', exact: true }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
  expect(
    await page.evaluate(
      () => JSON.parse(localStorage.getItem('billora-workspace')!).statements.length,
    ),
  ).toBe(2);
  const keptOriginal = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Original PDF', exact: true }).click();
  expect(await readFile((await (await keptOriginal).path())!)).toEqual(september);
  await page.getByRole('button', { name: 'Remove statement', exact: true }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await page.getByRole('button', { name: 'Open settings' }).click();
  await page.getByLabel('Password-protect full backup').uncheck();
  const backupDownloading = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Full backup (ZIP including files)' }).click();
  const backup = await readFile((await (await backupDownloading).path())!);
  const manifest = JSON.parse(strFromU8(unzipSync(backup)['billora-backup.json']));
  expect(manifest.workspace.statements).toHaveLength(1);
  expect(manifest.originals).toHaveLength(2);
  await page.getByRole('button', { name: 'Clear workspace & start fresh' }).click();
  await page.getByRole('button', { name: 'Clear workspace', exact: true }).click();
  await page.getByRole('button', { name: 'Open settings' }).click();
  await page
    .getByLabel('Choose a Billora full backup')
    .setInputFiles({ name: 'backup.zip', mimeType: 'application/zip', buffer: backup });
  await page.getByRole('button', { name: 'Confirm restore' }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await page.goto('/?requests=1');
  await page.locator('.request-list li button').click();
  const restoredDownloading = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Download request pack' }).click();
  const restoredFiles = unzipSync(await readFile((await (await restoredDownloading).path())!));
  expect(Buffer.from(restoredFiles['evidence/00-october.pdf'])).toEqual(october);
  expect(Buffer.from(restoredFiles['evidence/previous-september.pdf'])).toEqual(september);
  expect(JSON.parse(strFromU8(restoredFiles['comparison.json']))).toEqual(
    JSON.parse(strFromU8(files['comparison.json'])),
  );
  // Missing comparison evidence must block export instead of quietly omitting it.
  await page.evaluate(
    () =>
      new Promise<void>((resolve, reject) => {
        const opening = indexedDB.open('billora-documents');
        opening.onerror = () => reject(opening.error);
        opening.onsuccess = () => {
          const state = JSON.parse(localStorage.getItem('billora-workspace')!);
          const tx = opening.result.transaction('originals', 'readwrite');
          tx.objectStore('originals').delete(state.requests[0].comparison.previous.fileId);
          tx.oncomplete = () => {
            opening.result.close();
            resolve();
          };
        };
      }),
  );
  await page.getByRole('button', { name: 'Download request pack' }).click();
  await expect(page.getByRole('alert')).toContainText('previous statement PDF is missing');
  expect(errors).toEqual([]);
});

test('replacing a PDF resets prior figures and review; invalid files leave manual recovery available', async ({
  page,
}) => {
  await startImport(page);
  await upload(page, september, 'september.pdf');
  await page
    .getByLabel('Select municipal PDF')
    .setInputFiles({ name: 'october.pdf', mimeType: 'application/pdf', buffer: october });
  await expect(page.getByLabel('Total due (ZAR)')).toHaveValue('');
  await expect(page.getByLabel('I’ve checked the total')).not.toBeChecked();
  await page.getByRole('button', { name: 'Apply suggestions for review' }).click();
  await expect(page.getByLabel('Total due (ZAR)')).toHaveValue('1500.00');
  await page.getByLabel('I’ve checked the total').check();
  await page.getByLabel('Total due (ZAR)').fill('1600');
  await expect(page.getByLabel('I’ve checked the total')).not.toBeChecked();
  await page.getByLabel('Select municipal PDF').setInputFiles({
    name: 'invalid.pdf',
    mimeType: 'application/pdf',
    buffer: Buffer.from('not a PDF'),
  });
  await expect(page.getByRole('alert')).toContainText('Choose a valid PDF');
  await expect(page.getByRole('link', { name: /Open original PDF for review/ })).toHaveCount(0);
  await page.getByLabel('Enter a statement manually').check();
  await page.getByLabel('Statement month').fill('2026-10');
  await page.getByLabel('Payment due date').fill('2026-11-05');
  await page.getByLabel('Total due (ZAR)').fill('1600');
  await page.locator('.category-details summary').click();
  await page.getByLabel('Electricity (R)').fill('1600.01');
  await page.getByLabel('I’ve checked the total').check();
  await page.getByRole('button', { name: 'Save reviewed statement' }).click();
  await expect(page.getByRole('alert')).toContainText('no more than the total');
  await page.getByLabel('Electricity (R)').fill('1600');
  await page.getByLabel('I’ve checked the total').check();
  await save(page);
  const records = await page.evaluate(
    () => JSON.parse(localStorage.getItem('billora-workspace')!).statements,
  );
  expect(records[0]).toMatchObject({ amount: 1600, confidence: 'manual' });
  expect(records[0].fileId).toBeUndefined();
});

test('unreadable saved records are preserved and can be downloaded before a confirmed backup restore', async ({
  page,
}) => {
  await startImport(page);
  await page.getByRole('button', { name: 'Close dialog' }).click();
  await page.getByRole('button', { name: 'Open settings' }).click();
  await page.getByLabel('Password-protect full backup').uncheck();
  const downloading = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Full backup (ZIP including files)' }).click();
  const backup = await readFile((await (await downloading).path())!);
  const corrupt = '{"properties": [{"id":"important"}], "statements": []}';
  await page.evaluate((raw) => localStorage.setItem('billora-workspace', raw), corrupt);
  await page.goto('/');
  await expect(page.getByRole('alert', { name: 'Workspace recovery' })).toContainText(
    'Changes are paused',
  );
  await page.getByRole('button', { name: 'Properties', exact: true }).click();
  await page.getByRole('button', { name: 'Add property', exact: true }).first().click();
  await page.getByLabel('Property name').fill('Cannot overwrite');
  await page.getByLabel('Street address').fill('A street');
  await page.getByRole('button', { name: 'Add property', exact: true }).last().click();
  await expect(page.getByRole('dialog')).toBeVisible();
  expect(await page.evaluate(() => localStorage.getItem('billora-workspace'))).toBe(corrupt);
  await page.getByRole('button', { name: 'Close dialog' }).click();
  const recoveryDownload = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Download saved records' }).click();
  expect(await readFile((await (await recoveryDownload).path())!, 'utf8')).toBe(corrupt);
  await page.getByRole('button', { name: 'Open recovery settings' }).click();
  await page
    .getByLabel('Choose a Billora full backup')
    .setInputFiles({ name: 'backup.zip', mimeType: 'application/zip', buffer: backup });
  // Simulate the metadata commit failing after both old stores have been cleared.
  // Unreferenced files must survive rollback even though the metadata cannot be parsed.
  await page.evaluate(async () => {
    async function seed(name: string, store: string, id: string, content: string) {
      await new Promise<void>((resolve, reject) => {
        const opening = indexedDB.open(name, 1);
        opening.onupgradeneeded = () => opening.result.createObjectStore(store);
        opening.onerror = () => reject(opening.error);
        opening.onsuccess = () => {
          const tx = opening.result.transaction(store, 'readwrite');
          tx.objectStore(store).put(new Blob([content]), id);
          tx.oncomplete = () => {
            opening.result.close();
            resolve();
          };
          tx.onerror = () => reject(tx.error);
        };
      });
    }
    await seed(
      'billora-documents',
      'originals',
      'unreferenced-original',
      'Original retained through failed restore',
    );
    await seed(
      'billora-request-evidence',
      'files',
      'unreferenced-evidence',
      'Evidence retained through failed restore',
    );
    const originalSet = Storage.prototype.setItem;
    let fail = true;
    Storage.prototype.setItem = function (key, value) {
      if (key === 'billora-workspace' && fail) {
        fail = false;
        throw new DOMException('Simulated full device', 'QuotaExceededError');
      }
      return originalSet.call(this, key, value);
    };
  });
  await page.getByRole('button', { name: 'Confirm restore' }).click();
  await expect(page.getByRole('dialog').getByRole('alert')).toContainText(
    'Your previous workspace has been restored',
  );
  expect(await page.evaluate(() => localStorage.getItem('billora-workspace'))).toBe(corrupt);
  const retained = await page.evaluate(async () => {
    async function read(name: string, store: string, id: string) {
      return new Promise<string>((resolve, reject) => {
        const opening = indexedDB.open(name);
        opening.onerror = () => reject(opening.error);
        opening.onsuccess = () => {
          const tx = opening.result.transaction(store);
          const reading = tx.objectStore(store).get(id);
          reading.onsuccess = () => {
            opening.result.close();
            if (!(reading.result instanceof Blob)) {
              reject(new Error('Recovery file lost'));
              return;
            }
            void reading.result.text().then(resolve, reject);
          };
          reading.onerror = () => reject(reading.error);
        };
      });
    }
    return Promise.all([
      read('billora-documents', 'originals', 'unreferenced-original'),
      read('billora-request-evidence', 'files', 'unreferenced-evidence'),
    ]);
  });
  expect(retained).toEqual([
    'Original retained through failed restore',
    'Evidence retained through failed restore',
  ]);
  // A retry can commit normally; replacement is still explicitly confirmed.
  await page.getByRole('button', { name: 'Confirm restore' }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(page.getByRole('alert', { name: 'Workspace recovery' })).toHaveCount(0);
  expect(
    await page.evaluate(
      () => JSON.parse(localStorage.getItem('billora-workspace')!).properties[0].name,
    ),
  ).toBe('Evidence test home');
});

test('invalid backup records are rejected before replacing data and errors stay in settings', async ({
  page,
}) => {
  await page.goto('/');
  const saved = await page.evaluate(() => localStorage.getItem('billora-workspace'));
  const buffer = Buffer.from(
    zipSync({
      'billora-backup.json': strToU8(
        JSON.stringify({
          version: 2,
          workspace: { properties: [{ id: 'bad' }], statements: [], requests: [] },
          originals: [],
          evidence: [],
        }),
      ),
    }),
  );
  await page.getByRole('button', { name: 'Open settings' }).click();
  await page
    .getByLabel('Choose a Billora full backup')
    .setInputFiles({ name: 'bad.zip', mimeType: 'application/zip', buffer });
  await page.getByRole('button', { name: 'Confirm restore' }).click();
  await expect(page.getByRole('alert')).toContainText('Invalid property records');
  expect(await page.evaluate(() => localStorage.getItem('billora-workspace'))).toBe(saved);
});

test('help is keyboard accessible, responsive, and describes honest local boundaries', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/?help=1');
  const dialog = page.getByRole('dialog');
  await expect(dialog).toContainText('no claim of user research outcomes');
  await expect(dialog).toContainText('GitHub issues are public');
  for (const width of [320, 768, 1024, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    expect(await dialog.evaluate((el) => el.scrollWidth <= el.clientWidth)).toBe(true);
    await expect
      .poll(async () => {
        const box = await dialog.boundingBox();
        return !!box && box.x >= 0 && box.x + box.width <= width;
      })
      .toBe(true);
  }
  const audit = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
    .analyze();
  expect(
    audit.violations.map((v) => ({ id: v.id, targets: v.nodes.map((n) => n.target) })),
  ).toEqual([]);
  await page.getByRole('button', { name: 'Open backup & data controls' }).focus();
  await page.keyboard.press('Enter');
  await expect(page.getByLabel('Password-protect full backup')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toHaveCount(0);
});
