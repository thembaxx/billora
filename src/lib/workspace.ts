import type { Workspace } from '../types';

const record = (value: unknown): value is Record<string, unknown> =>
  !!value && typeof value === 'object' && !Array.isArray(value);
const text = (value: unknown): value is string => typeof value === 'string';
const optionalText = (value: unknown) => value === undefined || text(value);
const amount = (value: unknown) =>
  typeof value === 'number' && Number.isFinite(value) && value >= 0;
const uniqueIds = (items: unknown[]) =>
  items.every((item) => record(item) && text(item.id) && item.id.length > 0) &&
  new Set(items.map((item) => (item as Record<string, unknown>).id)).size === items.length;
const reference = (value: unknown) =>
  record(value) &&
  text(value.id) &&
  text(value.period) &&
  amount(value.amount) &&
  ['sample', 'imported'].includes(String(value.source)) &&
  optionalText(value.fileId) &&
  optionalText(value.fileName);

// Shared by startup and restore: reject incomplete records before they reach the UI.
// Older workspaces without service requests remain supported.
export function parseWorkspace(raw: unknown): Workspace {
  if (
    !record(raw) ||
    !Array.isArray(raw.properties) ||
    !Array.isArray(raw.statements) ||
    (raw.requests !== undefined && !Array.isArray(raw.requests))
  )
    throw new Error('Invalid workspace records.');
  const requests = raw.requests || [];
  if (
    raw.properties.length > 10000 ||
    raw.statements.length > 100000 ||
    requests.length > 100000 ||
    !uniqueIds(raw.properties) ||
    !uniqueIds(raw.statements) ||
    !uniqueIds(requests)
  )
    throw new Error('Invalid workspace record count or identifiers.');
  const propertyIds = new Set(raw.properties.map((p) => p.id));
  if (
    raw.properties.some(
      (p) =>
        !record(p) ||
        !text(p.name) ||
        !text(p.address) ||
        !text(p.account) ||
        !['Home', 'Rental', 'Business'].includes(String(p.kind)) ||
        ![
          'City of Tshwane',
          'City of Johannesburg',
          'City of Cape Town',
          'City of Ekurhuleni',
          'Other municipality',
        ].includes(String(p.municipality)) ||
        (p.location !== undefined &&
          (!record(p.location) ||
            typeof p.location.lat !== 'number' ||
            typeof p.location.lng !== 'number' ||
            !Number.isFinite(p.location.lat) ||
            !Number.isFinite(p.location.lng) ||
            Math.abs(p.location.lat) > 90 ||
            Math.abs(p.location.lng) > 180)),
    )
  )
    throw new Error('Invalid property records.');
  if (
    raw.statements.some(
      (s) =>
        !record(s) ||
        !reference(s) ||
        !propertyIds.has(s.propertyId) ||
        !text(s.period) ||
        !/^\d{4}-(0[1-9]|1[0-2])$/.test(s.period) ||
        !text(s.dueDate) ||
        !/^\d{4}-\d{2}-\d{2}$/.test(s.dueDate) ||
        !text(s.importedAt) ||
        !optionalText(s.extractedText) ||
        !record(s.categories) ||
        ['electricity', 'water', 'rates', 'services'].some(
          (key) => !amount((s.categories as Record<string, unknown>)[key]),
        ),
    )
  )
    throw new Error('Invalid statement records.');
  if (
    requests.some(
      (r) =>
        !record(r) ||
        !propertyIds.has(r.propertyId) ||
        !record(r.property) ||
        ['name', 'address', 'account', 'municipality'].some(
          (key) => !text((r.property as Record<string, unknown>)[key]),
        ) ||
        !['billing', 'meter', 'water', 'electricity', 'refuse', 'other'].includes(String(r.kind)) ||
        !['draft', 'ready', 'submitted', 'resolved'].includes(String(r.status)) ||
        [
          'localReference',
          'description',
          'desiredOutcome',
          'incidentDate',
          'createdAt',
          'updatedAt',
        ].some((key) => !text(r[key])) ||
        typeof r.confirmed !== 'boolean' ||
        !Array.isArray(r.checked) ||
        !r.checked.every(text) ||
        !Array.isArray(r.events) ||
        r.events.some((e) => !record(e) || !text(e.id) || !text(e.at) || !text(e.text)) ||
        !Array.isArray(r.evidence) ||
        !uniqueIds(r.evidence) ||
        r.evidence.some((f) => !record(f) || !text(f.name) || !text(f.type) || !amount(f.size)) ||
        (r.statement !== undefined && !reference(r.statement)) ||
        (r.comparison !== undefined &&
          (!record(r.comparison) ||
            !r.statement ||
            !reference(r.comparison.previous) ||
            !text(r.comparison.label) ||
            !amount(r.comparison.before) ||
            !amount(r.comparison.after))) ||
        (r.submission !== undefined &&
          (!record(r.submission) ||
            ['reference', 'channel', 'date', 'followUpOn'].some(
              (key) => !text((r.submission as Record<string, unknown>)[key]),
            ))),
    )
  )
    throw new Error('Invalid service request records.');
  return { properties: raw.properties, statements: raw.statements, requests } as Workspace;
}
