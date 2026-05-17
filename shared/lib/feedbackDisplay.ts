/** Shared formatting for wallet + agent feedback rows. */

import type { FeedbackClassification } from '@/shared/lib/feedbackClassification';

export interface FeedbackValueFields {
  value?: string;
  valueDecimals?: number;
  unit?: string;
  tag1?: string;
  /** Scale detected by backend: binary | star5 | star10 | pct100 | unbounded | "" */
  valueScale?: string;
  classification?: FeedbackClassification;
}

export const FEEDBACK_UNIT_BY_TAG: Record<string, string> = {
  responseTime: 'ms',
  processingTime: 's',
  blockDelay: 'blocks',
  uptime: '%',
  successRate: '%',
  confidence: '%',
  tps: 'tok/s',
  reachable: 'bool',
  ownerVerified: 'bool',
  kycCleared: 'bool',
};

export function resolveFeedbackUnit(fb: FeedbackValueFields): string {
  if (fb.unit && fb.unit !== 'none') return fb.unit;
  if (fb.tag1 && FEEDBACK_UNIT_BY_TAG[fb.tag1]) return FEEDBACK_UNIT_BY_TAG[fb.tag1]!;
  return '';
}

export function formatFeedbackWi(wi: number): string {
  if (!Number.isFinite(wi)) return '—';
  return wi.toFixed(2);
}

export function formatFeedbackVi(vi: number): string {
  if (!Number.isFinite(vi)) return '—';
  return vi.toFixed(2);
}

export function formatFeedbackPriceUsdc(price: number): string {
  if (!Number.isFinite(price)) return '—';
  return `${price.toFixed(2)} USDC`;
}

/** 10^n as bigint (avoids bigint ** which needs ES2016+ in TS). */
function bigintTenPow(n: number): bigint {
  if (!Number.isFinite(n) || n <= 0) return BigInt(1);
  const cap = Math.min(Math.floor(n), 256);
  let out = BigInt(1);
  const ten = BigInt(10);
  for (let i = 0; i < cap; i++) out *= ten;
  return out;
}

/** Integer string ÷ 10^decimals — no range clamping (on-chain value as stored). */
function scaleFeedbackIntegerString(valueStr: string, decimals: number): string {
  const raw = valueStr.trim();
  if (raw === '') return '0';
  let neg = false;
  let digits = raw;
  if (digits.startsWith('-')) {
    neg = true;
    digits = digits.slice(1);
  }
  if (!/^\d+$/.test(digits)) return raw;
  if (decimals <= 0) return (neg ? '-' : '') + BigInt(digits).toString();

  const bi = BigInt(digits);
  const scale = bigintTenPow(decimals);
  const intPart = bi / scale;
  const frac = bi % scale;
  if (frac === BigInt(0)) return (neg ? '-' : '') + intPart.toString();

  let fracStr = frac.toString().padStart(decimals, '0').replace(/0+$/, '');
  return (neg ? '-' : '') + `${intPart}.${fracStr}`;
}

/** Scaled numeric from on-chain integer + decimals; null for empty, bool, or non-integer raw. */
export function parseFeedbackScaledNumber(fb: FeedbackValueFields): number | null {
  const raw = (fb.value ?? '').trim();
  if (raw === '') return null;
  if (resolveFeedbackUnit(fb) === 'bool') return null;
  if (!/^-?\d+$/.test(raw)) return null;
  const scaled = scaleFeedbackIntegerString(raw, fb.valueDecimals ?? 0);
  const n = Number.parseFloat(scaled);
  return Number.isFinite(n) ? n : null;
}

/** Full-precision scaled numeric string for titles / copy (no [-1,1] normalization). */
export function formatFeedbackScaledRaw(fb: FeedbackValueFields): string {
  const raw = (fb.value ?? '').trim();
  if (raw === '') return '—';
  const decimals = fb.valueDecimals ?? 0;
  const unit = resolveFeedbackUnit(fb);
  if (unit === 'bool') {
    const low = raw.toLowerCase();
    if (low === 'true') return 'True';
    if (low === 'false') return 'False';
    try {
      return BigInt(raw) === BigInt(1) ? 'True' : 'False';
    } catch {
      return raw;
    }
  }
  if (!/^-?\d+$/.test(raw)) return raw;
  const scaled = scaleFeedbackIntegerString(raw, decimals);
  if (unit === '%') return `${scaled}%`;
  if (unit === 'tok/s') return `${scaled} tok/s`;
  if (unit === 'ms') return `${scaled} ms`;
  if (unit === 's') return `${scaled} s`;
  if (unit === 'blocks') return `${scaled} blk`;
  return unit ? `${scaled} ${unit}` : scaled;
}

/** Table / pill primary line: compact but unclamped; bool and tagged units preserved. */
export function formatFeedbackScaledPrimary(fb: FeedbackValueFields, maxFracDigits = 6): string {
  const full = formatFeedbackScaledRaw(fb);
  if (full === '—' || full === 'True' || full === 'False') return full;
  const unit = resolveFeedbackUnit(fb);
  const suffix =
    unit === '%'
      ? '%'
      : unit === 'tok/s'
        ? ' tok/s'
        : unit === 'ms'
          ? ' ms'
          : unit === 's'
            ? ' s'
            : unit === 'blocks'
              ? ' blk'
              : unit && unit !== 'bool'
                ? ` ${unit}`
                : '';

  const base = suffix ? full.slice(0, full.length - suffix.length) : full;
  const [intPart, frac = ''] = base.split('.');
  if (!frac) return full;
  if (frac.length <= maxFracDigits) return full;
  return `${intPart}.${frac.slice(0, maxFracDigits)}…${suffix}`;
}

/** Single-line label for value pill: scaled primary + unit when not already included in primary. */
export function formatFeedbackValuePillLabel(fb: FeedbackValueFields): string {
  const primary = formatFeedbackScaledPrimary(fb);
  const u = resolveFeedbackUnit(fb)?.trim();
  if (!u || u === 'bool') return primary;
  if (primary.endsWith(u) || primary.endsWith(` ${u}`) || primary.endsWith('%')) return primary;
  return `${primary} ${u}`;
}

export function formatFeedbackValue(fb: FeedbackValueFields): string {
  return formatFeedbackScaledRaw(fb);
}

/** Monospace hash / URL tail truncation for dense tables (full string in `title`). */
export function truncateFeedbackMiddle(s: string, headChars = 10, tailChars = 6): string {
  const t = s.trim();
  if (!t) return '';
  if (t.length <= headChars + tailChars + 1) return t;
  return `${t.slice(0, headChars)}…${t.slice(-tailChars)}`;
}
