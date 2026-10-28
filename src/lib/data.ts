import type { Workspace, Statement } from '../types';
import { parseWorkspace } from './workspace';

export const money = (value: number) =>
  `R ${value.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
export const dateLabel = (
  value: string,
  options: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short' },
) =>
  new Date(value + (value.length === 10 ? 'T12:00:00' : '')).toLocaleDateString('en-ZA', options);
export const latestStatements = (data: Workspace) =>
  data.properties.flatMap((p) => {
    const s = data.statements
      .filter((s) => s.propertyId === p.id)
      .sort(
        (a, b) => b.period.localeCompare(a.period) || b.importedAt.localeCompare(a.importedAt),
      )[0];
    return s ? [s] : [];
  });
export const months = ['May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct'];
export function demoData(): Workspace {
  const properties: Workspace['properties'] = [
    {
      id: 'home',
      name: 'The Parkhurst home',
      address: '24 Sixth Avenue, Parkhurst',
      municipality: 'City of Johannesburg',
      account: '910 482 672',
      kind: 'Home',
    },
    {
      id: 'rental',
      name: 'The Pretoria apartment',
      address: '18 Hazelwood Road, Pretoria',
      municipality: 'City of Tshwane',
      account: '382 106 459',
      kind: 'Rental',
    },
  ];
  const totals = [
    [1408, 1532, 1470, 1670, 1605, 1617.2],
    [1650, 1702, 1630, 1900, 1785, 1865.4],
  ];
  const statements: Statement[] = properties.flatMap((p, pi) =>
    totals[pi].map((amount, i) => ({
      id: `${p.id}-${i}`,
      propertyId: p.id,
      period: `2026-${String(i + 5).padStart(2, '0')}`,
      amount,
      dueDate: `2026-${String(i + 5).padStart(2, '0')}-${pi ? '28' : '31'}`,
      importedAt: `2026-${String(i + 5).padStart(2, '0')}-18T10:00:00Z`,
      source: 'sample' as const,
      categories: {
        electricity: +(amount * 0.42).toFixed(2),
        water: +(amount * 0.23).toFixed(2),
        rates: +(amount * 0.25).toFixed(2),
        services: +(amount * 0.1).toFixed(2),
      },
      paidNote: i < 5,
    })),
  );
  return { properties, statements, requests: [] };
}
// Keeps illustrative fixtures out of genuine billing and anomaly calculations.
// Legacy mixed workspaces retain original properties that have real imports or requests.
export function personalWorkspace(data: Workspace): Workspace {
  const statements = data.statements.filter((s) => s.source === 'imported');
  const referenced = new Set([
    ...statements.map((s) => s.propertyId),
    ...data.requests.map((r) => r.propertyId),
  ]);
  return {
    properties: data.properties.filter(
      (p) => !['home', 'rental'].includes(p.id) || referenced.has(p.id),
    ),
    statements,
    requests: data.requests,
  };
}

export interface WorkspaceLoad {
  data: Workspace;
  error: string;
  raw: string | null;
}
export function readWorkspace(): WorkspaceLoad {
  let raw: string | null = null;
  try {
    raw = localStorage.getItem('billora-workspace');
    if (raw === null) return { data: demoData(), error: '', raw: null };
    const data = parseWorkspace(JSON.parse(raw));
    const personal =
      data.statements.some((s) => s.source === 'sample') &&
      data.statements.some((s) => s.source === 'imported')
        ? personalWorkspace(data)
        : data;
    return { data: personal, error: '', raw };
  } catch {
    return {
      data: { properties: [], statements: [], requests: [] },
      error:
        'Your saved workspace could not be read. Changes are paused so it is not overwritten. Download the saved records for recovery, restore a full backup in Settings, or explicitly clear this workspace.',
      raw,
    };
  }
}
export function download(content: Blob | string, name: string, type = 'text/plain') {
  const url = URL.createObjectURL(
    content instanceof Blob ? content : new Blob([content], { type }),
  );
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
export function calendarFile(statement: Statement, propertyName: string) {
  const day = statement.dueDate.replaceAll('-', '');
  const escape = (s: string) =>
    s
      .replaceAll('\\', '\\\\')
      .replaceAll('\n', '\\n')
      .replaceAll(',', '\\,')
      .replaceAll(';', '\\;');
  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Billora//Account reminders//EN',
    'BEGIN:VEVENT',
    `UID:${statement.id}@billora.local`,
    `DTSTAMP:${new Date()
      .toISOString()
      .replace(/[-:]/g, '')
      .replace(/\.\d{3}/, '')}`,
    `DTSTART;VALUE=DATE:${day}`,
    `SUMMARY:${escape(`Municipal account due: ${propertyName}`)}`,
    `DESCRIPTION:${escape(`${money(statement.amount)} based on your imported statement. Pay via your official municipal portal.`)}`,
    'BEGIN:VALARM',
    'TRIGGER:-P2D',
    'ACTION:DISPLAY',
    'DESCRIPTION:Municipal account due in two days',
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n');
}
