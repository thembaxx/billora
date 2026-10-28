import { strFromU8, strToU8, unzipSync, zipSync } from 'fflate';
import type { Workspace } from '../types';
import { parseWorkspace } from './workspace';
import { readDocument, saveDocument, clearDocuments, documentEntries } from './documents';
import {
  readRequestFile,
  saveRequestFile,
  clearRequestFiles,
  requestFileEntries,
} from './request-files';

interface Archive {
  version: 2;
  exportedAt: string;
  workspace: Workspace;
  originals: Array<{ id: string; path: string }>;
  evidence: Array<{ id: string; path: string }>;
}
const limit = 120 * 1024 * 1024;

function ids(data: Workspace) {
  return {
    originals: [
      ...new Set(
        [
          ...data.statements.map((s) => s.fileId),
          ...data.requests.flatMap((r) => [r.statement?.fileId, r.comparison?.previous.fileId]),
        ].filter((id): id is string => !!id),
      ),
    ],
    evidence: [...new Set(data.requests.flatMap((r) => r.evidence.map((f) => f.id)))],
  };
}

async function collect(data: Workspace) {
  const saved: Record<string, Uint8Array> = {};
  const refs = ids(data);
  for (let i = 0; i < refs.originals.length; i++) {
    const blob = await readDocument(refs.originals[i]);
    if (!blob) throw new Error('Missing original PDF. Save it separately before backing up.');
    saved['originals/' + i + '.pdf'] = new Uint8Array(await blob.arrayBuffer());
  }
  for (let i = 0; i < refs.evidence.length; i++) {
    const blob = await readRequestFile(refs.evidence[i]);
    if (!blob)
      throw new Error('Missing request evidence. Restore the attachment before backing up.');
    saved['evidence/' + i + '.bin'] = new Uint8Array(await blob.arrayBuffer());
  }
  const manifest: Archive = {
    version: 2,
    exportedAt: new Date().toISOString(),
    workspace: data,
    originals: refs.originals.map((id, i) => ({ id, path: 'originals/' + i + '.pdf' })),
    evidence: refs.evidence.map((id, i) => ({ id, path: 'evidence/' + i + '.bin' })),
  };
  saved['billora-backup.json'] = strToU8(JSON.stringify(manifest));
  return saved;
}

export async function createFullBackup(data: Workspace): Promise<Blob> {
  const files = await collect(data);
  if (Object.values(files).reduce((n, bytes) => n + bytes.length, 0) > limit)
    throw new Error(
      'This workspace exceeds the 120 MB browser backup limit. Save files individually.',
    );
  const zip = zipSync(files, { level: 0 });
  return new Blob([new Uint8Array(zip)], { type: 'application/zip' });
}

function validate(raw: unknown, files: Record<string, Uint8Array>): Archive {
  if (!raw || typeof raw !== 'object') throw new Error('Invalid Billora backup.');
  const archive = raw as Archive;
  if (
    archive.version !== 2 ||
    !archive.workspace ||
    !Array.isArray(archive.workspace.properties) ||
    !Array.isArray(archive.workspace.statements) ||
    !Array.isArray(archive.workspace.requests) ||
    !Array.isArray(archive.originals) ||
    !Array.isArray(archive.evidence)
  )
    throw new Error('Unsupported or incomplete Billora backup.');
  archive.workspace = parseWorkspace(archive.workspace);
  const expected = ids(archive.workspace);
  for (const [kind, refs] of [
    ['originals', archive.originals],
    ['evidence', archive.evidence],
  ] as const) {
    const needed = kind === 'originals' ? expected.originals : expected.evidence;
    if (
      refs.length !== needed.length ||
      new Set(refs.map((r) => r.id)).size !== refs.length ||
      refs.some(
        (r) =>
          !needed.includes(r.id) ||
          !/^([a-z]+)\/\d+\.(pdf|bin)$/.test(r.path) ||
          !r.path.startsWith(kind + '/') ||
          !files[r.path],
      )
    )
      throw new Error('Backup is missing original documents or request evidence.');
  }
  return archive;
}

export async function restoreFullBackup(file: File): Promise<Workspace> {
  if (!/\.zip$/i.test(file.name) || file.size > limit)
    throw new Error('Choose a Billora ZIP under 120 MB.');
  const bytes = new Uint8Array(await file.arrayBuffer());
  let totalSize = 0;
  let entryCount = 0;
  const files = unzipSync(bytes, {
    filter: (entry) => {
      entryCount++;
      totalSize += entry.originalSize;
      if (entryCount > 1000 || entry.originalSize > limit || totalSize > limit) {
        throw new Error('Backup exceeds safe extraction limits.');
      }
      return true;
    },
  });
  if (Object.values(files).reduce((n, part) => n + part.length, 0) > limit)
    throw new Error('Decompressed backup exceeds 120 MB.');
  if (!files['billora-backup.json']) throw new Error('Not a Billora full backup.');
  const archive = validate(JSON.parse(strFromU8(files['billora-backup.json'])), files);
  // Recovery must preserve exact saved bytes and all files, even when metadata is unreadable
  // or some file references are missing. Snapshot before touching either store.
  const previousRaw = localStorage.getItem('billora-workspace');
  const [previousDocuments, previousEvidence] = await Promise.all([
    documentEntries(),
    requestFileEntries(),
  ]);
  try {
    await clearDocuments();
    await clearRequestFiles();
    for (const item of archive.originals)
      await saveDocument(
        item.id,
        new Blob([new Uint8Array(files[item.path])], { type: 'application/pdf' }),
      );
    for (const item of archive.evidence)
      await saveRequestFile(item.id, new Blob([new Uint8Array(files[item.path])]));
    localStorage.setItem('billora-workspace', JSON.stringify(archive.workspace));
    return archive.workspace;
  } catch {
    try {
      await clearDocuments();
      await clearRequestFiles();
      for (const [id, blob] of previousDocuments) await saveDocument(id, blob);
      for (const [id, blob] of previousEvidence) await saveRequestFile(id, blob);
      if (localStorage.getItem('billora-workspace') !== previousRaw) {
        if (previousRaw === null) localStorage.removeItem('billora-workspace');
        else localStorage.setItem('billora-workspace', previousRaw);
      }
    } catch {
      throw new Error(
        'Restore failed, and automatic rollback was incomplete. Your original export may be needed.',
      );
    }
    throw new Error('Restore failed. Your previous workspace has been restored.');
  }
}
