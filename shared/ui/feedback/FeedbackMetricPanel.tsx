'use client';

import { feedbackMetricPanelClass } from '@/shared/lib/feedback/feedbackMetricTone';

export interface FeedbackMetricPanelProps {
  vi: number;
  revoked: boolean;
  metricLabel: string;
  valueDisplay: string;
}

export function FeedbackMetricPanel({ vi, revoked, metricLabel, valueDisplay }: FeedbackMetricPanelProps) {
  return (
    <div
      className={`flex shrink-0 flex-col justify-center rounded-xl border px-4 py-3 text-center min-h-[4.25rem] min-w-0 w-full sm:min-w-[9rem] sm:max-w-md sm:self-stretch lg:w-auto lg:max-w-[11rem] ${feedbackMetricPanelClass(
        vi,
        revoked
      )}`}
    >
      <span
        className="block truncate text-[10px] font-semibold uppercase tracking-wide opacity-90 mb-1 leading-snug text-inherit"
        title={metricLabel}
      >
        {metricLabel}
      </span>
      <span className="text-lg sm:text-xl font-bold tabular-nums leading-tight break-all text-inherit">
        {valueDisplay}
      </span>
    </div>
  );
}
