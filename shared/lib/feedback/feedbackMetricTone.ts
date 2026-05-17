/** VI-based panel tones for dark UI (design tokens only). */

import { resolveFeedbackDisplayCategory } from '@/shared/lib/feedbackClassification';
import type { FeedbackValueFields } from '@/shared/lib/feedbackDisplay';
import { parseFeedbackScaledNumber, resolveFeedbackUnit } from '@/shared/lib/feedbackDisplay';

export function feedbackMetricPanelClass(vi: number, revoked: boolean): string {
  if (revoked) {
    return 'bg-white/10 text-subtle border-white/25';
  }
  if (vi >= 0.8) {
    return 'bg-success/20 text-success border-success/45';
  }
  if (vi >= 0.5) {
    return 'bg-warningDim text-warning border-warning/50';
  }
  return 'bg-danger/20 text-danger border-danger/45';
}

/**
 * Normalize a service feedback real value to 0–100 using the backend-detected scale.
 * Falls back to the legacy heuristic when scale is absent or unknown.
 */
function serviceFeedbackScore0to100ForBands(parsed: number, scale?: string): number {
  const clamp = (v: number) => Math.min(100, Math.max(0, v));
  switch (scale) {
    case 'binary':    return clamp(parsed * 100);
    case 'star5':     return clamp((parsed / 5) * 100);
    case 'star10':    return clamp((parsed / 10) * 100);
    case 'pct100':    return clamp(parsed);
    case 'unbounded': return clamp(parsed); // best-effort
    default: {
      // Legacy heuristic: |x| ≤ 1 treated as fraction, otherwise clamp to [0,100].
      const ax = Math.abs(parsed);
      return ax <= 1 ? clamp(parsed * 100) : clamp(parsed);
    }
  }
}

/** Pill colors by score on 0–100: 0–39 red, 40–69 yellow, 70–84 blue, 85–100 green. */
function serviceFeedbackScorePillClass(base: string, parsed: number, scale?: string): string {
  const score = serviceFeedbackScore0to100ForBands(parsed, scale);
  if (score < 40) {
    return `${base} bg-rose-500/22 text-rose-100 border-rose-400/55`;
  }
  if (score < 70) {
    return `${base} bg-amber-500/22 text-amber-100 border-amber-400/52`;
  }
  if (score < 85) {
    return `${base} bg-sky-500/22 text-sky-100 border-sky-400/50`;
  }
  return `${base} bg-emerald-500/22 text-emerald-100 border-emerald-400/55`;
}

/** Colored pill for on-chain value ÷ 10^decimals (not VI). */
export function feedbackValuePillClass(fb: FeedbackValueFields, revoked: boolean): string {
  const base =
    'inline-flex max-w-[14rem] shrink-0 items-center justify-center rounded-full border px-2.5 py-0.5 text-[11px] font-semibold tabular-nums min-w-0';
  if (revoked) {
    return `${base} bg-white/10 text-subtle border-white/25`;
  }
  const displayCategory = resolveFeedbackDisplayCategory(fb.classification);
  if (displayCategory === 'service_feedback') {
    const score = parseFeedbackScaledNumber(fb);
    if (score !== null) {
      return serviceFeedbackScorePillClass(base, score, fb.valueScale);
    }
  }
  const unit = resolveFeedbackUnit(fb);
  const raw = (fb.value ?? '').trim().toLowerCase();
  if (unit === 'bool') {
    const isTrue = raw === '1' || raw === 'true' || (() => {
      try {
        return BigInt(fb.value ?? '0') === BigInt(1);
      } catch {
        return false;
      }
    })();
    return isTrue
      ? `${base} bg-emerald-500/22 text-emerald-100 border-emerald-400/55`
      : `${base} bg-rose-500/22 text-rose-100 border-rose-400/55`;
  }
  if (unit === '%' || fb.tag1 === 'uptime' || fb.tag1 === 'successRate') {
    return `${base} bg-amber-500/22 text-amber-100 border-amber-400/52`;
  }
  if (unit === 'ms' || unit === 's' || unit === 'blocks' || unit === 'tok/s') {
    return `${base} bg-sky-500/22 text-sky-100 border-sky-400/50`;
  }
  return `${base} bg-violet-500/20 text-violet-100 border-violet-400/50`;
}
