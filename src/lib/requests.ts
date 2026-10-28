import type { Property, RequestKind, ServiceRequest, Statement } from '../types';
import { money } from './data';
import { readDocument } from './documents';
import { readRequestFile } from './request-files';

export const requestKinds: Record<
  RequestKind,
  { label: string; evidence: { id: string; label: string }[] }
> = {
  billing: {
    label: 'Billing query',
    evidence: [
      { id: 'bill', label: 'Relevant statement or bill' },
      { id: 'comparison', label: 'Previous bill or payment evidence, if relevant' },
    ],
  },
  meter: {
    label: 'Meter reading',
    evidence: [
      { id: 'reading', label: 'Dated meter photo and reading' },
      { id: 'meter', label: 'Meter number and previous reading, if available' },
    ],
  },
  water: {
    label: 'Water service',
    evidence: [
      { id: 'location', label: 'Affected location and when the issue started' },
      { id: 'photo', label: 'Photos or previous reference, if available' },
    ],
  },
  electricity: {
    label: 'Electricity service',
    evidence: [
      { id: 'location', label: 'Affected location and when the issue started' },
      { id: 'meter', label: 'Meter number or previous reference, if available' },
    ],
  },
  refuse: {
    label: 'Refuse collection',
    evidence: [
      { id: 'collection', label: 'Missed collection date and collection address' },
      { id: 'photo', label: 'Photos or previous reference, if available' },
    ],
  },
  other: {
    label: 'Other municipal issue',
    evidence: [
      { id: 'details', label: 'Clear description and affected location' },
      { id: 'supporting', label: 'Supporting documents or previous reference, if relevant' },
    ],
  },
};
export const requestStatus: Record<ServiceRequest['status'], string> = {
  draft: 'Draft · not submitted',
  ready: 'Ready · not submitted',
  submitted: 'Submission recorded by you',
  resolved: 'Resolved · recorded by you',
};
export type RequestMutation = (
  id: string,
  change: (current: ServiceRequest) => ServiceRequest,
) => boolean;
export const localDay = (date = new Date()) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
export function requestEvent(text: string) {
  return { id: crypto.randomUUID(), at: new Date().toISOString(), text };
}
export const statementReference = (s: Statement) => ({
  id: s.id,
  period: s.period,
  amount: s.amount,
  source: s.source,
  fileId: s.fileId,
  fileName: s.fileName,
});
export function newRequest(property: Property, statement?: Statement): ServiceRequest {
  const now = new Date().toISOString();
  return {
    id: crypto.randomUUID(),
    localReference: `BIL-${localDay().replaceAll('-', '')}-${crypto.randomUUID().slice(0, 6).toUpperCase()}`,
    propertyId: property.id,
    property: {
      name: property.name,
      address: property.address,
      municipality: property.municipality,
      account: property.account,
    },
    kind: 'billing',
    description: '',
    desiredOutcome: '',
    incidentDate: '',
    statement: statement ? statementReference(statement) : undefined,
    evidence: [],
    checked: [],
    confirmed: false,
    status: 'draft',
    events: [requestEvent('Draft created on this device. Nothing submitted.')],
    createdAt: now,
    updatedAt: now,
  };
}
export const isReady = (r: ServiceRequest) =>
  r.description.trim().length >= 20 &&
  r.desiredOutcome.trim().length >= 5 &&
  r.checked.includes('authority') &&
  r.confirmed;
export const followUpDue = (r: ServiceRequest) =>
  r.status === 'submitted' && !!r.submission?.followUpOn && r.submission.followUpOn <= localDay();

export function requestLetter(r: ServiceRequest, followUp = false, hideBalance = false) {
  const statement = r.statement;
  return [
    `${followUp ? 'FOLLOW-UP' : 'SERVICE REQUEST'} — DRAFT FOR YOUR REVIEW`,
    'Prepared in Billora. This document has not been sent by Billora.',
    `Billora local reference: ${r.localReference} (not a municipal reference)`,
    '',
    `To: ${r.property.municipality}`,
    `Subject: ${requestKinds[r.kind].label} — ${r.property.name}`,
    `Property: ${r.property.address}`,
    `Municipal account: ${r.property.account || '[add account reference, if required]'}`,
    ...(r.incidentDate ? [`Issue first noticed: ${r.incidentDate}`] : []),
    ...(statement
      ? [
          `Related statement: ${statement.period} · ${hideBalance ? 'Amount hidden' : money(statement.amount)} · ${statement.source === 'sample' ? 'ILLUSTRATIVE SAMPLE — not an actual bill' : 'user-reviewed import, not live verified data'}`,
        ]
      : []),
    ...(r.comparison
      ? [
          `Previous statement: ${r.comparison.previous.period} · ${hideBalance ? 'Amount hidden' : money(r.comparison.previous.amount)} · ${r.comparison.previous.source === 'sample' ? 'ILLUSTRATIVE SAMPLE — not an actual bill' : 'user-reviewed import, not live verified data'}`,
          `Comparison — ${r.comparison.label}: ${hideBalance ? 'Amounts hidden' : `${money(r.comparison.before)} → ${money(r.comparison.after)} (difference ${money(r.comparison.after - r.comparison.before)})`}`,
          'Comparison is based on user-reviewed figures. It does not establish a billing error.',
        ]
      : []),
    ...(followUp && r.submission
      ? [
          '',
          `Previously submitted: ${r.submission.date} via ${r.submission.channel}`,
          `Municipal reference recorded by me: ${r.submission.reference}`,
          'Please provide an update on the request below.',
        ]
      : []),
    '',
    'Dear Municipal Services Team,',
    '',
    r.description.trim(),
    '',
    'Requested assistance:',
    r.desiredOutcome.trim(),
    '',
    'Supporting evidence:',
    ...(statement?.fileId ? [`- Linked statement: ${statement.fileName || 'statement.pdf'}`] : []),
    ...(r.comparison?.previous.fileId
      ? [`- Previous statement: ${r.comparison.previous.fileName || 'previous-statement.pdf'}`]
      : []),
    ...r.evidence.map((f) => `- ${f.name}`),
    ...requestKinds[r.kind].evidence
      .filter((e) => r.checked.includes(e.id))
      .map((e) => `- Checked by me: ${e.label}`),
    ...(!r.evidence.length && !statement?.fileId && !r.comparison?.previous.fileId
      ? ['No document files are attached. Add any evidence required by the official channel.']
      : []),
    '',
    'Kind regards,',
    '[Add your name and safe contact details before submitting]',
    '',
    'Review this draft and the attachments before sharing. The checklist is general guidance, not an official municipal application form. Check the municipality’s current requirements. Submitted and resolved statuses in Billora are personal records, not verified municipal updates.',
  ].join('\n');
}
const fileName = (name: string) =>
  Array.from(name, (character) =>
    character.charCodeAt(0) < 32 || character.charCodeAt(0) === 127 ? '_' : character,
  )
    .join('')
    .replace(/[\\/]/g, '_')
    .replace(/^\.+/, '')
    .slice(0, 140) || 'document';
export async function requestPack(r: ServiceRequest): Promise<Blob> {
  if (!isReady(r))
    throw new Error(
      'Complete the description, requested assistance, authority and review checks first.',
    );
  const { zipSync, strToU8 } = await import('fflate');
  const files: Record<string, Uint8Array> = {
    'request-draft.txt': strToU8(requestLetter(r)),
    'request-record.json': strToU8(
      JSON.stringify(
        {
          formatVersion: 1,
          exportedAt: new Date().toISOString(),
          ...r,
          municipalityVerified: false,
        },
        null,
        2,
      ),
    ),
    'READ-ME.txt': strToU8(
      'BILLORA REQUEST PACK\n\nNothing in this ZIP has been submitted by Billora. Review request-draft.txt, add your name/contact details, and confirm the official requirements before submitting through the municipality. The attachments contain personal information. Keep this ZIP secure.\n\nLocal status, evidence checks and timeline entries are recorded by the user, not verified by a municipality. The JSON is a readable record; automatic restore is not supported.\n',
    ),
  };
  if (r.comparison) {
    files['comparison.json'] = strToU8(
      JSON.stringify(
        {
          source:
            r.statement?.source === 'imported' && r.comparison.previous.source === 'imported'
              ? 'User-reviewed imported figures; not municipality verified'
              : 'Includes illustrative sample figures; not evidence of a real bill',
          previous: r.comparison.previous,
          current: r.statement,
          category: r.comparison.label,
          before: r.comparison.before,
          after: r.comparison.after,
          difference: Math.round((r.comparison.after - r.comparison.before) * 100) / 100,
          billingErrorConfirmed: false,
        },
        null,
        2,
      ),
    );
  }
  for (const [label, statement] of [
    ['current', r.statement],
    ['previous', r.comparison?.previous],
  ] as const) {
    if (!statement?.fileId) continue;
    const pdf = await readDocument(statement.fileId);
    if (!pdf)
      throw new Error(
        `The ${label} statement PDF is missing. Reimport the original, or change the related statement to remove this comparison before preparing the pack.`,
      );
    const prefix = label === 'current' ? '00' : 'previous';
    files[`evidence/${prefix}-${fileName(statement.fileName || 'statement.pdf')}`] = new Uint8Array(
      await pdf.arrayBuffer(),
    );
  }
  for (const [index, evidence] of r.evidence.entries()) {
    const blob = await readRequestFile(evidence.id);
    if (!blob)
      throw new Error(
        `“${evidence.name}” is missing from this device. Remove it or attach it again before preparing the pack.`,
      );
    files[`evidence/${String(index + 1).padStart(2, '0')}-${fileName(evidence.name)}`] =
      new Uint8Array(await blob.arrayBuffer());
  }
  // PDFs/photos are already compressed. Stored ZIP entries avoid expensive recompression.
  const bytes = zipSync(files, { level: 0 });
  return new Blob([new Uint8Array(bytes).buffer], { type: 'application/zip' });
}
export function requestCalendar(r: ServiceRequest) {
  if (!r.submission?.followUpOn) return '';
  const escape = (s: string) =>
    s
      .replaceAll('\\', '\\\\')
      .replaceAll('\n', '\\n')
      .replaceAll(',', '\\,')
      .replaceAll(';', '\\;');
  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Billora//Personal follow-up//EN',
    'BEGIN:VEVENT',
    `UID:${r.id}@billora.local`,
    `DTSTAMP:${new Date()
      .toISOString()
      .replace(/[-:]/g, '')
      .replace(/\.\d{3}/, '')}`,
    `DTSTART;VALUE=DATE:${r.submission.followUpOn.replaceAll('-', '')}`,
    `SUMMARY:${escape(`Follow up: ${requestKinds[r.kind].label} · ${r.property.name}`)}`,
    `DESCRIPTION:${escape(`Personal reminder chosen by you, not an official response deadline. Reference: ${r.submission.reference}. Billora does not submit follow-ups or send background notifications.`)}`,
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n');
}
