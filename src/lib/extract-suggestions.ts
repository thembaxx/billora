export interface FieldSuggestion {
  value: string;
  evidence: string;
}
export type SuggestedField = 'period' | 'due' | 'amount' | 'electricity' | 'water' | 'rates';
export type Suggestions = Partial<Record<SuggestedField, FieldSuggestion>>;

const months = ['january', 'february', 'march', 'april', 'may', 'june',
  'july', 'august', 'september', 'october', 'november', 'december'];
const amountPattern = '(?:R\\s*)?([0-9][0-9, ]*(?:\\.[0-9]{2})?)';

function amount(text: string, labels: string): FieldSuggestion | undefined {
  const match = text.match(new RegExp('(?:' + labels + ')\\s*[:\\-–]?\\s*' + amountPattern, 'i'));
  if (!match) return;
  const value = Number(match[1].replace(/[ ,]/g, ''));
  if (!Number.isFinite(value) || value < 0 || value > 100000000) return;
  return { value: value.toFixed(2), evidence: match[0].trim().slice(0, 150) };
}

function dateValue(value: string): string | undefined {
  const iso = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (iso) {
    const date = new Date(iso[1] + '-' + iso[2] + '-' + iso[3] + 'T12:00:00Z');
    return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value ? value : undefined;
  }
  const numeric = value.match(/^(\d{1,2})[/.](\d{1,2})[/.](\d{4})$/);
  if (numeric) return dateValue(numeric[3] + '-' + numeric[2].padStart(2, '0') + '-' + numeric[1].padStart(2, '0'));
  const words = value.toLowerCase().match(/^(\d{1,2})\s+([a-z]+)\s+(\d{4})$/);
  const index = words ? months.findIndex((m) => m.startsWith(words[2])) : -1;
  return words && index >= 0 ? dateValue(words[3] + '-' + String(index + 1).padStart(2, '0') + '-' + words[1].padStart(2, '0')) : undefined;
}

export function suggestStatementFields(text: string): Suggestions {
  const result: Suggestions = {};
  if (!text.trim()) return result;
  const period = text.match(/(?:statement\s*(?:month|period)|billing\s*period)\s*[:\-–]?\s*(20\d{2}-(?:0[1-9]|1[0-2])|(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+20\d{2})/i);
  if (period) {
    const raw = period[1].toLowerCase();
    const m = raw.match(/^([a-z]+)\s+(20\d{2})$/);
    const val = m ? m[2] + '-' + String(months.indexOf(m[1]) + 1).padStart(2, '0') : raw;
    result.period = { value: val, evidence: period[0].slice(0, 150) };
  }
  const due = text.match(/(?:payment\s+due\s+date|due\s+date|pay\s+by)\s*[:\-–]?\s*(\d{4}-\d{2}-\d{2}|\d{1,2}[/.]\d{1,2}[/.]\d{4}|\d{1,2}\s+[a-z]+\s+20\d{2})/i);
  if (due) {
    const parsed = dateValue(due[1]);
    if (parsed) result.due = { value: parsed, evidence: due[0].slice(0, 150) };
  }
  result.amount = amount(text, 'total\\s+(?:amount\\s+)?due|amount\\s+payable|total\\s+payable');
  result.electricity = amount(text, 'electricity(?:\\s+charges?)?');
  result.water = amount(text, 'water(?:\\s+charges?)?');
  result.rates = amount(text, 'property\\s+rates|rates(?:\\s+charges?)?');
  for (const key of Object.keys(result) as SuggestedField[]) {
    if (!result[key]) delete result[key];
  }
  return result;
}
