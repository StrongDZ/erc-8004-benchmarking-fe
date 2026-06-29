/**
 * Aligns with GET /agents/.../feedbacks and GET /wallet/.../feedbacks (see
 * internal/api/service/mapper.go toFeedbackRow): `classification.rule` is the
 * rule engine verdict; `classification.fallback` is set when the LLM ran.
 */

export interface FeedbackClassification {
  rule?: { category: string; feature?: string };
  fallback?: { category: string; feature?: string; reason?: string; confidence?: number };
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

/** Prefer LLM fallback feature when present; otherwise rule feature. */
export function resolveFeedbackDisplayFeature(cls: FeedbackClassification | null | undefined): string {
  if (!cls) return '';
  const f = cls.fallback?.feature?.trim();
  if (f) return f;
  const r = cls.rule?.feature?.trim();
  if (r) return r;
  return '';
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

/** Tooltip for the feature axis (rule vs fallback). */
export function feedbackFeatureTitle(cls: FeedbackClassification | null | undefined): string | undefined {
  if (!cls) return undefined;
  const rule = cls.rule?.feature?.trim() || '';
  const fb = cls.fallback?.feature?.trim();
  const parts: string[] = [];
  if (rule) parts.push(`Rule: ${rule}`);
  if (fb) parts.push(`Fallback: ${fb}`);
  return parts.length ? parts.join(' · ') : undefined;
}
