import { expect, test } from '@playwright/test';
import { reviewOcrCandidate, shouldUseOcr, type OcrCandidate } from '../src/lib/ocr-review';

const candidate = (overrides: Partial<OcrCandidate> = {}): OcrCandidate => ({
  text: 'Account total: R 1234.50',
  page: 1,
  source: 'local-ocr',
  ...overrides,
});

test('OCR runs only with explicit consent and insufficient embedded text', () => {
  expect(shouldUseOcr('', false)).toBe(false);
  expect(shouldUseOcr('   ', false)).toBe(false);
  expect(shouldUseOcr('', true)).toBe(true);
  expect(shouldUseOcr('   ', true)).toBe(true);
  expect(shouldUseOcr('x'.repeat(39), true)).toBe(true);
  expect(shouldUseOcr('x'.repeat(40), true)).toBe(false);
  expect(shouldUseOcr('x'.repeat(39), false)).toBe(false);
});

test('even a high judge score leaves extracted values pending human confirmation', () => {
  const result = reviewOcrCandidate(candidate(), { score: 1, verdict: 'consistent' });
  expect(result.status).toBe('needs-review');
  expect(result.reasons).toContain('Human confirmation required before using extracted values');
});

test('invalid pages, empty text and oversized output are rejected', () => {
  for (const invalid of [
    candidate({ page: 0 }),
    candidate({ text: '  ' }),
    candidate({ text: 'x'.repeat(100_001) }),
  ]) {
    expect(reviewOcrCandidate(invalid).status).toBe('rejected');
  }
});

test('bad judge values remain review-only and never approve a candidate', () => {
  for (const judge of [
    { score: Number.NaN },
    { score: 1.1 },
    { score: 0.79 },
    { score: 1, verdict: 'provider error' },
  ]) {
    expect(reviewOcrCandidate(candidate(), judge).status).toBe('needs-review');
  }
});
