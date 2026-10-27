// Version 1: magic | version | PBKDF2 rounds (big-endian) | salt | nonce | AES-GCM ciphertext/tag.
// The complete fixed header is authenticated so its format and KDF parameters cannot be changed.
const MAGIC = new Uint8Array([66, 73, 76, 76, 79, 82, 65, 0]);
const VERSION = 1;
const ITERATIONS = 600_000;
const SALT_SIZE = 16;
const NONCE_SIZE = 12;
const SALT_OFFSET = MAGIC.length + 1 + 4;
const NONCE_OFFSET = SALT_OFFSET + SALT_SIZE;
const HEADER_SIZE = NONCE_OFFSET + NONCE_SIZE;
export const MAX_BACKUP_BYTES = 120 * 1024 * 1024;
export const ENCRYPTED_BACKUP_TYPE = 'application/vnd.billora.encrypted-backup';

function cryptoAvailable() {
  if (!globalThis.crypto?.subtle)
    throw new Error('Encrypted backups need a browser with Web Crypto on HTTPS or localhost.');
}

function validatePassword(password: string) {
  if (
    typeof password !== 'string' ||
    Array.from(password).length < 12 ||
    password.length > 1024 ||
    !password.trim()
  )
    throw new Error('Use a password of at least 12 characters, up to 1,024 characters.');
}

function buffer(bytes: Uint8Array): ArrayBuffer {
  const copied = new Uint8Array(bytes.length);
  copied.set(bytes);
  return copied.buffer;
}

async function deriveKey(password: string, salt: Uint8Array): Promise<CryptoKey> {
  const encoded = new TextEncoder().encode(password);
  try {
    const material = await crypto.subtle.importKey('raw', encoded, 'PBKDF2', false, ['deriveKey']);
    return await crypto.subtle.deriveKey(
      { name: 'PBKDF2', salt: buffer(salt), iterations: ITERATIONS, hash: 'SHA-256' },
      material,
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt', 'decrypt'],
    );
  } finally {
    encoded.fill(0);
  }
}

export function hasEncryptedBackupHeader(bytes: Uint8Array): boolean {
  return bytes.length >= MAGIC.length && MAGIC.every((value, index) => bytes[index] === value);
}

/** Detection reads only the marker; actual envelope validation is performed before decryption. */
export async function isEncryptedBackup(file: Blob): Promise<boolean> {
  return hasEncryptedBackupHeader(new Uint8Array(await file.slice(0, MAGIC.length).arrayBuffer()));
}

export async function encryptBackup(archive: Blob, password: string): Promise<Blob> {
  cryptoAvailable();
  validatePassword(password);
  if (!archive.size || archive.size > MAX_BACKUP_BYTES)
    throw new Error('Choose a non-empty Billora ZIP under 120 MB.');
  const header = new Uint8Array(HEADER_SIZE);
  header.set(MAGIC);
  header[MAGIC.length] = VERSION;
  new DataView(header.buffer).setUint32(MAGIC.length + 1, ITERATIONS, false);
  const salt = crypto.getRandomValues(new Uint8Array(SALT_SIZE));
  const nonce = crypto.getRandomValues(new Uint8Array(NONCE_SIZE));
  header.set(salt, SALT_OFFSET);
  header.set(nonce, NONCE_OFFSET);
  const key = await deriveKey(password, salt);
  const plaintext = new Uint8Array(await archive.arrayBuffer());
  try {
    const ciphertext = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv: nonce, additionalData: header, tagLength: 128 },
      key,
      plaintext,
    );
    return new Blob([header, ciphertext], { type: ENCRYPTED_BACKUP_TYPE });
  } finally {
    plaintext.fill(0);
  }
}

/** Authenticate the whole archive before passing its returned ZIP to the existing restore code. */
export async function decryptBackup(file: Blob, password: string): Promise<Blob> {
  cryptoAvailable();
  validatePassword(password);
  if (file.size < HEADER_SIZE + 16 || file.size > MAX_BACKUP_BYTES + HEADER_SIZE + 16)
    throw new Error('This encrypted backup is incomplete or exceeds 120 MB.');
  const bytes = new Uint8Array(await file.arrayBuffer());
  if (!hasEncryptedBackupHeader(bytes) || bytes[MAGIC.length] !== VERSION)
    throw new Error('This is not a supported Billora encrypted backup.');
  const iterations = new DataView(bytes.buffer).getUint32(MAGIC.length + 1, false);
  if (iterations !== ITERATIONS)
    throw new Error('This encrypted backup uses unsupported password-derivation settings.');
  const header = bytes.slice(0, HEADER_SIZE);
  const key = await deriveKey(password, bytes.slice(SALT_OFFSET, NONCE_OFFSET));
  let plaintext: ArrayBuffer;
  try {
    plaintext = await crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv: bytes.slice(NONCE_OFFSET, HEADER_SIZE),
        additionalData: header,
        tagLength: 128,
      },
      key,
      bytes.slice(HEADER_SIZE),
    );
  } catch {
    throw new Error('Could not unlock the backup. Check your password and the file’s integrity.');
  }
  const result = new Blob([plaintext], { type: 'application/zip' });
  new Uint8Array(plaintext).fill(0);
  return result;
}
