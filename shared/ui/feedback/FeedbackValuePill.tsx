'use client';

import type { FeedbackValueFields } from '@/shared/lib/feedbackDisplay';
import { formatFeedbackScaledRaw, formatFeedbackValuePillLabel } from '@/shared/lib/feedbackDisplay';
import { feedbackValuePillClass } from '@/shared/lib/feedback/feedbackMetricTone';

export interface FeedbackValuePillProps {
  fb: FeedbackValueFields;
  revoked: boolean;
}

export function FeedbackValuePill({ fb, revoked }: FeedbackValuePillProps) {
  const primary = formatFeedbackValuePillLabel(fb);
  const title = `raw=${fb.value ?? ''} · decimals=${fb.valueDecimals ?? 0} → ${formatFeedbackScaledRaw(fb)}`;
  return (
    <span className={feedbackValuePillClass(fb, revoked)} title={title}>
      <span className="min-w-0 truncate">{primary}</span>
    </span>
  );
}
