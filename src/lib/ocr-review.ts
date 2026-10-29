/** OCR quality gate. Never treat OCR output as verified financial/legal evidence. */
export type OcrCandidate = {
  text: string;
  page: number;
  source: 'embedded-text' | 'local-ocr' | 'minicpm-ocr';
  evidence?: string;
  confidence?: number;
};
export type OcrReview = {
  candidate: OcrCandidate;
  status: 'needs-review' | 'rejected';
  reasons: string[];
};
export function reviewOcrCandidate(
  candidate: OcrCandidate,
  judge?: { score: number; verdict?: string },
): OcrReview {
  const reasons: string[] = [];
  if (!Number.isInteger(candidate.page) || candidate.page < 1) reasons.push('Invalid source page');
  if (!candidate.text.trim()) reasons.push('No extracted text');
  if (candidate.text.length > 100_000) reasons.push('Extraction exceeds safety limit');
  if (judge) {
    if (!Number.isFinite(judge.score) || judge.score < 0 || judge.score > 1)
      reasons.push('Judge result unavailable');
    else if (judge.score < 0.8) reasons.push('Low OCR consistency score');
    if (judge.verdict && /error|invalid|fail/i.test(judge.verdict))
      reasons.push('Judge reported an error');
  }
  if (candidate.source === 'minicpm-ocr')
    reasons.push('Remote OCR must be explicitly consented to');
  reasons.push('Human confirmation required before using extracted values');
  return {
    candidate,
    status: reasons.some((r) => /Invalid|No extracted|exceeds/.test(r))
      ? 'rejected'
      : 'needs-review',
    reasons,
  };
}
export function shouldUseOcr(embeddedText: string, explicitConsent: boolean): boolean {
  return explicitConsent && embeddedText.trim().length < 40;
}
