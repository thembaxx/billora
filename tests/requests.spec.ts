import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { readFile } from 'node:fs/promises';
import { strFromU8, unzipSync } from 'fflate';

const evidence = Buffer.from('Local evidence for a municipal request.');

test('prepare an offline request, export evidence, record a submission and follow it through', async ({
  page,
  context,
}) => {
  test.setTimeout(60000);
  const errors: string[] = [];
  const external: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('request', (request) => {
    if (new URL(request.url()).hostname !== '127.0.0.1') external.push(request.url());
  });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/?view=properties');
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
  });
  await expect
    .poll(() => page.evaluate(() => navigator.serviceWorker.controller !== null))
    .toBe(true);
  await page.getByRole('button', { name: 'Service requests', exact: true }).click();
  await page.getByRole('button', { name: 'New request', exact: true }).click();
  await page
    .getByLabel('What happened?')
    .fill(
      'My October water charge appears to use an estimated reading despite a recent meter reading.',
    );
  await page
    .getByLabel('What help would you like?')
    .fill('Please explain the estimated charge and review it against my meter reading.');
  await page.getByRole('button', { name: 'Continue', exact: true }).click();
  await page.getByLabel('I’m authorised to use these records').check();
  await page
    .getByLabel('Attach request evidence')
    .setInputFiles({ name: 'supporting-note.pdf', mimeType: 'application/pdf', buffer: evidence });
  await expect(page.locator('.request-file-list')).toContainText('supporting-note.pdf');
  await page.getByRole('button', { name: 'Continue', exact: true }).click();
  await expect(page.getByRole('region', { name: 'Draft letter preview' })).toContainText(
    'not been sent by Billora',
  );
  await page.getByLabel('I’ve reviewed the details and evidence.').check();
  await page.getByRole('button', { name: 'Mark ready for submission' }).click();
  await expect(page.locator('.request-detail-heading .request-badge')).toHaveText(
    'Ready · not submitted',
  );
  const saved = await page.evaluate(
    () => JSON.parse(localStorage.getItem('billora-workspace') || '{}').requests[0],
  );
  const id = saved.evidence[0].id;
  await context.setOffline(true);
  await page.goto('/?requests=1');
  await page.locator('.request-list li button').click();
  const zipDownload = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Download request pack' }).click();
  const zip = await zipDownload;
  expect(zip.suggestedFilename()).toMatch(/billora-request-BIL-.*\.zip/);
  const files = unzipSync(await readFile((await zip.path())!));
  expect(strFromU8(files['request-draft.txt'])).toContain('estimated reading');
  expect(strFromU8(files['READ-ME.txt'])).toContain('Nothing in this ZIP has been submitted');
  expect(JSON.parse(strFromU8(files['request-record.json'])).municipalityVerified).toBe(false);
  expect(Buffer.from(files['evidence/01-supporting-note.pdf'])).toEqual(evidence);
  await page.getByRole('button', { name: 'Record my submission', exact: true }).click();
  await page.getByLabel('Municipal reference / receipt number').fill('MUNI-TEST-1042');
  const today = new Date().toISOString().slice(0, 10);
  await page.getByLabel('Personal follow-up date').fill(today);
  await page.getByLabel('I submitted this through an official channel.').check();
  await page.getByRole('button', { name: 'Save submission record' }).click();
  await expect(page.locator('.request-detail-heading .request-badge')).toHaveText(
    'Submission recorded by you',
  );
  await expect(page.locator('.request-submission-summary')).toContainText('Your follow-up is due');
  const followDownload = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Download follow-up draft' }).click();
  const follow = await followDownload;
  expect(await readFile((await follow.path())!, 'utf8')).toContain('MUNI-TEST-1042');
  const calendarDownload = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Calendar reminder', exact: true }).click();
  const calendar = await calendarDownload;
  expect(await readFile((await calendar.path())!, 'utf8')).toContain(
    'not an official response deadline',
  );
  await page.getByRole('button', { name: 'Close dialog' }).click();
  await page.locator('.due-card').click();
  await expect(page.locator('.request-reminders')).toContainText('MUNI-TEST-1042');
  await page.locator('.request-reminders button').click();
  await page.getByRole('button', { name: 'Add a note' }).click();
  await page
    .getByLabel('Your update', { exact: true })
    .fill('I called the municipal office and asked for an update.');
  await page.getByRole('button', { name: 'Save note', exact: true }).click();
  await expect(page.locator('.request-timeline')).toContainText('I called the municipal office');
  await page.getByRole('button', { name: 'Mark resolved for my records' }).click();
  await page.getByRole('button', { name: 'Confirm my resolution note' }).click();
  await expect(page.locator('.request-detail-heading .request-badge')).toHaveText(
    'Resolved · recorded by you',
  );
  await page.getByRole('dialog').evaluate((dialog) => {
    dialog.scrollTop = dialog.scrollHeight;
  });
  const closeBounds = await page.getByRole('button', { name: 'Close dialog' }).boundingBox();
  const dialogBounds = await page.getByRole('dialog').boundingBox();
  expect(
    closeBounds &&
      dialogBounds &&
      closeBounds.y >= dialogBounds.y &&
      closeBounds.y + closeBounds.height <= dialogBounds.y + dialogBounds.height,
  ).toBeTruthy();
  for (const width of [320, 390, 768, 1024, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    const bounds = await page.getByRole('dialog').boundingBox();
    expect(bounds && bounds.x >= 0 && bounds.x + bounds.width <= width).toBeTruthy();
    expect(
      await page.getByRole('dialog').evaluate((dialog) => dialog.scrollWidth <= dialog.clientWidth),
    ).toBe(true);
  }
  const audit = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
    .analyze();
  expect(
    audit.violations.map((v) => ({
      id: v.id,
      nodes: v.nodes.map((n) => ({ target: n.target, summary: n.failureSummary })),
    })),
  ).toEqual([]);
  await page.getByRole('button', { name: 'Delete this local request' }).click();
  await page.getByRole('button', { name: 'Delete request', exact: true }).click();
  await expect(page.locator('.request-list li')).toHaveCount(0);
  expect(
    await page.evaluate(
      (id) =>
        new Promise((resolve) => {
          const open = indexedDB.open('billora-request-evidence');
          open.onsuccess = () => {
            const db = open.result;
            const read = db.transaction('files').objectStore('files').get(id);
            read.onsuccess = () => {
              resolve(read.result === undefined);
              db.close();
            };
          };
        }),
      id,
    ),
  ).toBe(true);
  expect(errors).toEqual([]);
  expect(external).toEqual([]);
});

test('legacy workspaces support request drafts, exports and complete request-evidence reset', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  await page.evaluate(() => {
    localStorage.setItem(
      'billora-workspace',
      JSON.stringify({
        properties: [
          {
            id: 'legacy',
            name: 'Existing home',
            address: '1 Example Road',
            municipality: 'City of Tshwane',
            account: 'TEST-42',
            kind: 'Home',
          },
        ],
        statements: [],
      }),
    );
    localStorage.setItem(
      'billora-demo',
      JSON.stringify({
        account: { id: 'demo', name: 'Test Demo', email: 'demo@example.com', demo: true },
        connections: [],
      }),
    );
  });
  await page.goto('/?requests=1');
  await page.getByRole('button', { name: 'New request', exact: true }).click();
  await page
    .getByLabel('What happened?')
    .fill('The refuse collection was missed at my property this week.');
  await page
    .getByLabel('What help would you like?')
    .fill('Please confirm when collection can be arranged.');
  await page.getByLabel('Issue type').selectOption('refuse');
  await page.getByRole('button', { name: 'Continue', exact: true }).click();
  await page
    .getByLabel('Attach request evidence')
    .setInputFiles({ name: 'collection.pdf', mimeType: 'application/pdf', buffer: evidence });
  await expect(page.locator('.request-file-list')).toContainText('collection.pdf');
  await page.getByRole('button', { name: 'Save & finish later' }).click();
  await expect(page.locator('.request-detail-heading .request-badge')).toHaveText(
    'Draft · not submitted',
  );
  await page.getByRole('button', { name: 'Close dialog' }).click();
  await page.getByRole('button', { name: 'Open settings', exact: true }).click();
  await page.getByRole('button', { name: 'Dark', exact: true }).click();
  const exportDownload = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export account data (JSON, no PDFs)' }).click();
  const exported = await exportDownload;
  const record = JSON.parse(await readFile((await exported.path())!, 'utf8'));
  expect(record.requests[0].evidence[0].name).toBe('collection.pdf');
  expect(record.requests[0].description).toContain('refuse collection');
  await page.getByRole('button', { name: 'Service requests & follow-ups' }).click();
  await page.locator('.request-list li button').click();
  await page.getByRole('button', { name: 'Continue preparing' }).click();
  await page.getByRole('button', { name: 'Continue', exact: true }).click();
  const audit = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
    .analyze();
  expect(audit.violations.map((v) => ({ id: v.id, nodes: v.nodes.map((n) => n.target) }))).toEqual(
    [],
  );
  await page.getByRole('button', { name: 'Close dialog' }).click();
  await page.getByRole('button', { name: 'Open settings', exact: true }).click();
  await page.getByRole('button', { name: 'Clear workspace & start fresh' }).click();
  await page.getByRole('button', { name: 'Clear workspace', exact: true }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  const state = await page.evaluate(() => ({
    workspace: JSON.parse(localStorage.getItem('billora-workspace') || '{}'),
    demo: JSON.parse(localStorage.getItem('billora-demo') || '{}'),
    settings: JSON.parse(localStorage.getItem('billora-settings') || '{}'),
  }));
  expect(state.workspace).toEqual({ properties: [], statements: [], requests: [] });
  expect(state.demo.account.email).toBe('demo@example.com');
  expect(state.settings.theme).toBe('dark');
  expect(
    await page.evaluate(
      () =>
        new Promise((resolve) => {
          const open = indexedDB.open('billora-request-evidence');
          open.onsuccess = () => {
            const db = open.result;
            const count = db.transaction('files').objectStore('files').count();
            count.onsuccess = () => {
              resolve(count.result);
              db.close();
            };
          };
        }),
    ),
  ).toBe(0);
});
