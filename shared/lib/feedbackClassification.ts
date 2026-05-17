/**
 * Aligns with GET /agents/.../feedbacks and GET /wallet/.../feedbacks (see
 * internal/api/service/mapper.go toFeedbackRow): `classification.rule` is the
 * rule engine verdict; `classification.fallback` is set when the LLM ran.
 */

export interface FeedbackClassification {
  rule?: { category: string };
  fallback?: { category: string; reason?: string; confidence?: number };
  /** Legacy flat API shape (pre-nested classification). */
  category?: string;
  confidence?: number;
  source?: string;
  normalizedTag?: string;
}

/** Prefer LLM fallback category when present; otherwise rule (then legacy `category`). */
export function resolveFeedbackDisplayCategory(cls: FeedbackClassification | null | undefined): string {
  if (!cls) return 'unknown';
  const f = cls.fallback?.category?.trim();
  if (f) return f;
  const r = cls.rule?.category?.trim();
  if (r) return r;
  const legacy = cls.category?.trim();
  if (legacy) return legacy;
  return 'unknown';
}

/** Tooltip: rule vs fallback for debugging / transparency. */
export function feedbackClassificationTitle(cls: FeedbackClassification | null | undefined): string | undefined {
  if (!cls) return undefined;
  const rule = cls.rule?.category?.trim() || cls.category?.trim() || '';
  const fb = cls.fallback?.category?.trim();
  const parts: string[] = [];
  if (rule) parts.push(`Rule: ${rule}`);
  if (fb) parts.push(`Fallback: ${fb}`);
  return parts.length ? parts.join(' · ') : undefined;
}
