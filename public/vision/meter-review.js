// Deterministic review helpers. No AI result is accepted as a verified meter reading.
const READING_LIMIT = 100_000_000;
export function parseReading(raw) {
  if (typeof raw !== 'string' || !/^\s*\d{1,9}(?:\.\d{1,3})?\s*$/.test(raw)) return null;
  const value = Number(raw.trim());
  return Number.isFinite(value) && value <= READING_LIMIT ? value : null;
}
export function suggestMeterReadings(text) {
  const result = { current: null, previous: null, evidence: [] };
  for (const line of String(text || '').split(/[\r\n]+/).slice(0, 180)) {
    const entry = line.trim().slice(0, 240);
    if (/\b(?:meter\s*(?:no\.?|number|id|serial)|account\s*(?:number|no\.?))\b/i.test(entry)) continue;
    const kind = /\b(?:previous|prior|last)\s+(?:(?:meter|register)\s+)?reading\b/i.test(entry)
      ? 'previous'
      : /\b(?:current|actual|present)\s+(?:(?:meter|register)\s+)?reading\b/i.test(entry)
        ? 'current'
        : /^meter\s+(?:reading\s+)?/i.test(entry) ? 'current' : null;
    if (!kind || result[kind] !== null) continue;
    const match = entry.match(/(?:reading\s*[:=\-]?|^meter\s*(?:reading\s*)?[:=\-]?|^current\s*[:=\-]?)\s*(\d{1,9}(?:\.\d{1,3})?)(?!\d)/i);
    const value = match ? parseReading(match[1]) : null;
    if (value === null) continue;
    result[kind] = match[1];
    result.evidence.push({ field: kind, line: entry });
  }
  return result;
}
export function reviewMeterUsage({ previous, current, unit = 'kWh', date = '' }) {
  const before = parseReading(previous);
  const after = parseReading(current);
  if (before === null || after === null) return { ok: false, message: 'Enter valid previous and current non-negative readings (up to 9 digits and 3 decimal places).' };
  if (after < before) return { ok: false, message: 'The current reading is lower than the previous one. Meter rollover, replacement or an entry error needs independent review.' };
  if (!['kWh','m³','units'].includes(unit)) return { ok: false, message: 'Choose a supported meter unit.' };
  const usage = Math.round((after - before) * 1000) / 1000;
  const when = /^\d{4}-\d{2}-\d{2}$/.test(date) && !Number.isNaN(Date.parse(date + 'T12:00:00Z')) ? date : '(date not provided)';
  return {ok:true, previous:before, current:after, usage, unit, date:when,
    report:'Billora meter review (user-verified values, not a bill or payment proof)\nDate: '+when+'\nPrevious reading: '+before+' '+unit+'\nCurrent reading: '+after+' '+unit+'\nDifference: '+usage+' '+unit+'\nSource: photo reviewed by user; check the original photograph and municipal statement before using this information.'};
}
