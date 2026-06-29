'use client';

import { Award, ChevronRight, MessageSquare, Target } from 'lucide-react';
import type { ServiceOverview } from '@/shared/api/types';

export function hasServiceScore(svc: ServiceOverview): boolean {
    return Boolean(svc.scoring && svc.scoring.totalTasks > 0);
}

function successTone(rate: number) {
    if (rate >= 0.8) return { bar: 'bg-success', text: 'text-success', track: 'bg-success/15' };
    if (rate >= 0.5) return { bar: 'bg-warning', text: 'text-warning', track: 'bg-warning/15' };
    return { bar: 'bg-danger', text: 'text-danger', track: 'bg-danger/15' };
}

function reputationTone(score: number) {
    if (score >= 70) return 'text-primary';
    if (score >= 40) return 'text-accent';
    return 'text-white/85';
}

interface Props {
    svc: ServiceOverview;
    onViewFeedback?: (endpoint: string) => void;
    compact?: boolean;
}

export function ServiceReputationStrip({ svc, onViewFeedback, compact = false }: Props) {
    if (!hasServiceScore(svc) || !svc.scoring) return null;

    const { reputationScore, successRate, totalTasks, totalPassed } = svc.scoring;
    const success = successTone(successRate);
    const repClass = reputationTone(reputationScore);
    const pct = Math.round(Math.min(100, Math.max(0, successRate * 100)));

    return (
        <div
            className={[
                'relative overflow-hidden rounded-xl border border-white/10',
                'bg-gradient-to-br from-white/[0.05] via-[#0c1018] to-accent/[0.07]',
                compact ? 'p-3' : 'p-3.5',
            ].join(' ')}
        >
            <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-accent/50 to-transparent" />

            <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex items-center gap-2 min-w-0">
                    <span className="flex items-center justify-center w-7 h-7 rounded-lg border border-accent/25 bg-accent/10 text-accent shrink-0">
                        <Award size={14} />
                    </span>
                    <div className="min-w-0">
                        <p className="text-3xs uppercase tracking-widest text-subtle font-semibold leading-none">
                            Service reputation
                        </p>
                        {!compact && totalPassed != null && (
                            <p className="text-3xs text-muted mt-1 truncate">
                                {totalPassed} passed · {totalTasks} total
                            </p>
                        )}
                    </div>
                </div>

                {onViewFeedback && svc.endpoint && (
                    <button
                        type="button"
                        onClick={() => onViewFeedback(svc.endpoint!)}
                        className="inline-flex items-center gap-1 shrink-0 rounded-lg border border-white/10 bg-white/[0.03] px-2.5 py-1.5 text-2xs font-medium text-accent hover:text-primary hover:border-primary/35 hover:bg-primary/10 transition-colors group"
                    >
                        <MessageSquare size={12} className="opacity-80" />
                        <span>Feedback</span>
                        <ChevronRight
                            size={12}
                            className="opacity-60 group-hover:translate-x-0.5 transition-transform"
                        />
                    </button>
                )}
            </div>

            <div className="grid grid-cols-3 gap-2">
                <div className="rounded-lg border border-white/[0.06] bg-black/25 px-2.5 py-2 text-center">
                    <p className={`text-lg font-bold font-heading tabular-nums leading-none ${repClass}`}>
                        {reputationScore.toFixed(1)}
                    </p>
                    <p className="text-3xs uppercase tracking-wider text-subtle mt-1 font-semibold">
                        Score
                    </p>
                </div>

                <div className="rounded-lg border border-white/[0.06] bg-black/25 px-2.5 py-2 text-center">
                    <p className={`text-lg font-bold font-heading tabular-nums leading-none ${success.text}`}>
                        {pct}%
                    </p>
                    <p className="text-3xs uppercase tracking-wider text-subtle mt-1 font-semibold">
                        Success
                    </p>
                </div>

                <div className="rounded-lg border border-white/[0.06] bg-black/25 px-2.5 py-2 text-center">
                    <p className="text-lg font-bold font-heading text-white tabular-nums leading-none">
                        {totalTasks}
                    </p>
                    <p className="text-3xs uppercase tracking-wider text-subtle mt-1 font-semibold">
                        Tasks
                    </p>
                </div>
            </div>

            <div className="mt-3 flex items-center gap-2">
                <Target size={11} className={`shrink-0 ${success.text} opacity-70`} />
                <div className={`flex-1 h-1.5 rounded-full overflow-hidden ${success.track}`}>
                    <div
                        className={`h-full rounded-full transition-all ${success.bar}`}
                        style={{ width: `${pct}%` }}
                    />
                </div>
                <span className={`text-3xs tabular-nums font-medium ${success.text}`}>{pct}%</span>
            </div>
        </div>
    );
}
