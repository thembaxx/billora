import { readFile } from 'node:fs/promises';
import { test, expect } from '@playwright/test';
import { strFromU8, strToU8, unzipSync, zipSync } from 'fflate';
import {
  decryptBackup,
  encryptBackup,
  hasEncryptedBackupHeader,
  isEncryptedBackup,
} from '../src/lib/encrypted-backup';

const password = 'a separate secure backup password';

function archive() {
  return new Blob([
    new Uint8Array(
      zipSync({
        'billora-backup.json': strToU8(JSON.stringify({ version: 2, name: 'My home' })),
        'originals/0.pdf': strToU8('%PDF-1.4 local original'),
        'evidence/0.bin': new Uint8Array([0, 255, 11, 42]),
      }),
    ),
  ]);
}

test('encrypted backup roundtrip preserves the archive and uses fresh encryption', async () => {
  const original = archive();
  const first = await encryptBackup(original, password);
  const second = await encryptBackup(original, password);
  const firstBytes = new Uint8Array(await first.arrayBuffer());
  expect(await isEncryptedBackup(first)).toBe(true);
  expect(hasEncryptedBackupHeader(firstBytes)).toBe(true);
  expect(Buffer.from(firstBytes).equals(Buffer.from(await second.arrayBuffer()))).toBe(false);
  const restored = new Uint8Array(await (await decryptBackup(first, password)).arrayBuffer());
  expect(Buffer.from(restored).equals(Buffer.from(await original.arrayBuffer()))).toBe(true);
  const files = unzipSync(restored);
  expect(JSON.parse(strFromU8(files['billora-backup.json']))).toEqual({
    version: 2,
    name: 'My home',
  });
  expect(strFromU8(files['originals/0.pdf'])).toBe('%PDF-1.4 local original');
  expect([...files['evidence/0.bin']]).toEqual([0, 255, 11, 42]);
});

test('wrong passwords and modified format, KDF, salt, nonce or ciphertext cannot unlock a backup', async () => {
  const encrypted = await encryptBackup(archive(), password);
  await expect(decryptBackup(encrypted, 'a completely different password')).rejects.toThrow(
    'Could not unlock the backup',
  );
  const bytes = new Uint8Array(await encrypted.arrayBuffer());
  // Version, rounds, salt, nonce, ciphertext and authentication tag are separate failure cases.
  for (const index of [8, 9, 14, 30, 42, bytes.length - 1]) {
    const modified = bytes.slice();
    modified[index] ^= 1;
    await expect(decryptBackup(new Blob([modified]), password)).rejects.toThrow();
  }
  await expect(decryptBackup(encrypted.slice(0, 20), password)).rejects.toThrow('incomplete');
  expect(await isEncryptedBackup(archive())).toBe(false);
});

test('encrypted full backup restores through settings and a wrong password leaves current data intact', async ({
  page,
}) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Start my workspace' }).click();
  await page.getByRole('button', { name: 'Properties', exact: true }).click();
  await page.getByRole('button', { name: 'Add property', exact: true }).first().click();
  await page.getByLabel('Property name').fill('Encrypted test home');
  await page.getByLabel('Street address').fill('12 Test Road');
  await page.getByRole('button', { name: 'Add property', exact: true }).last().click();
  const saved = await page.evaluate(() => localStorage.getItem('billora-workspace'));

  await page.getByRole('button', { name: 'Open settings' }).click();
  await expect(page.getByLabel('Password-protect full backup')).toBeChecked();
  await page.getByLabel('Backup password (12 characters minimum)').fill(password);
  await page.getByLabel('Confirm backup password').fill(password);
  const downloading = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Download encrypted full backup' }).click();
  const downloaded = await downloading;
  expect(downloaded.suggestedFilename()).toBe('billora-complete-backup.billora');
  const bytes = await readFile((await downloaded.path())!);
  expect(hasEncryptedBackupHeader(bytes)).toBe(true);

  await page.getByRole('button', { name: 'Clear workspace & start fresh' }).click();
  await page.getByRole('button', { name: 'Clear workspace', exact: true }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect
    .poll(() =>
      page.evaluate(
        () => JSON.parse(localStorage.getItem('billora-workspace') || '{}').properties?.length,
      ),
    )
    .toBe(0);
  const cleared = await page.evaluate(() => localStorage.getItem('billora-workspace'));
  await page.getByRole('button', { name: 'Open settings' }).click();
  await page.getByLabel('Choose a Billora full backup').setInputFiles({
    name: downloaded.suggestedFilename(),
    mimeType: 'application/octet-stream',
    buffer: bytes,
  });
  await page.getByLabel('Backup password (encrypted files only)').fill('a wrong backup password');
  await page.getByRole('button', { name: 'Confirm restore' }).click();
  await expect(
    page.getByText('Could not unlock the backup. Check your password and the file’s integrity.'),
  ).toBeVisible();
  expect(await page.evaluate(() => localStorage.getItem('billora-workspace'))).toBe(cleared);

  await page.getByLabel('Backup password (encrypted files only)').fill(password);
  await page.getByRole('button', { name: 'Confirm restore' }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  expect(
    JSON.parse((await page.evaluate(() => localStorage.getItem('billora-workspace'))) || '{}'),
  ).toEqual(JSON.parse(saved || '{}'));
});
