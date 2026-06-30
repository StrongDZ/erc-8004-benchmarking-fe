'use client';
import { useEffect, useState } from 'react';
import { api, AgentProfile, HeatmapDay, RadarData, TrustScorePoint, formatPercent } from '@/shared/api/client';
import TrustScoreChart from '@/features/agent-profile/components/TrustScoreChart';
import ActivityHeatmap from '@/features/agent-profile/components/ActivityHeatmap';
import AgentRadarChart from '@/features/agent-profile/components/SkillRadarChart';
import { ScoreBreakdownPanel } from '@/features/agent-profile/components/ScoreBreakdownPanel';
import { Skeleton } from '@/shared/ui/Skeleton';
import { feedbackCategoryDisplayLabel } from '@/shared/lib/feedback/feedbackCategories';

interface Props { chainId: number; agentId: string; }

// Class-distribution colors keyed by category (matches FeedbackCategoryBadge variants):
// quality = purple, quantity = orange, junk = red, others/"Evaluating" = gray.
const CATEGORY_COLOR: Record<string, string> = {
    quality: '#8B5CF6',
    quantity: '#F59E0B',
    junk: '#F87171',
    others: '#94A3B8',
};
const CATEGORY_GRADIENT: Record<string, string> = {
    quality: 'linear-gradient(90deg,#8B5CF6,#A78BFA)',
    quantity: 'linear-gradient(90deg,#F59E0B,#FBBF24)',
    junk: 'linear-gradient(90deg,#F87171,#FCA5A5)',
    others: 'linear-gradient(90deg,#94A3B8,#CBD5E1)',
};
const categoryColor = (k: string) => CATEGORY_COLOR[k.trim().toLowerCase()] ?? '#64748B';
const categoryGradient = (k: string) =>
    CATEGORY_GRADIENT[k.trim().toLowerCase()] ?? 'linear-gradient(90deg,#64748B,#94A3B8)';
const GRAD_PASSED = 'linear-gradient(90deg,#34D399,#10B981)';
const GRAD_FAILED = 'linear-gradient(90deg,#F87171,#EF4444)';

export default function StatisticsTab({ chainId, agentId }: Props) {
    const [profile, setProfile] = useState<AgentProfile | null>(null);
    const [trustHistory, setTrustHistory] = useState<TrustScorePoint[]>([]);
    const [heatmap, setHeatmap] = useState<HeatmapDay[]>([]);
    const [radar, setRadar] = useState<RadarData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        setLoading(true);
        Promise.all([
            api.agentProfile(chainId, agentId).then(r => setProfile(r.data ?? null)),
            api.trustScoreHistory(chainId, agentId).then(r => setTrustHistory(r.data?.points ?? [])),
            api.activityHeatmap(chainId, agentId).then(r => setHeatmap(r.data ?? [])),
            api.radar(chainId, agentId).then(r => setRadar(r.data ?? null)),
        ]).finally(() => setLoading(false));
    }, [chainId, agentId]);

    if (loading) {
        return (
            <div className="flex flex-col gap-4">
                <Skeleton className="h-32 w-full rounded-2xl" />
                <Skeleton className="h-80 w-full rounded-2xl" />
                <Skeleton className="h-48 w-full rounded-2xl" />
            </div>
        );
    }

    const s = profile?.scoring;
    const totalFeedbacks = s
        ? (s.totalFeedbacks > 0 ? s.totalFeedbacks : Object.values(s.classDistribution ?? {}).reduce((a, b) => a + b, 0))
        : 0;
    const qualityPresent = (s?.totalTasks ?? 0) > 0;
    const feedDenom = Math.max(1, totalFeedbacks);
    const taskDenom = s ? Math.max(1, s.totalTasks) : 1;
    const passedPct = s ? (s.totalPassed / taskDenom) * 100 : 0;
    const failedPct = s ? (s.totalFailed / taskDenom) * 100 : 0;

    return (
        <div className="flex flex-col gap-6">
            {s && (
                <ScoreBreakdownPanel
                    breakdown={s.scoreBreakdown}
                    compositeScore={s.trustScore}
                    qualityPresent={qualityPresent}
                />
            )}

            {s ? (
                <div className="grid grid-cols-1 lg:grid-cols-[3fr_2fr] gap-6">
                    {/* LEFT — one ledger: feedback is the whole; scored tasks are its quality subset */}
                    <div className="card p-5 h-full flex flex-col overflow-hidden">
                        <div className="flex items-center justify-between mb-3">
                            <h3 className="font-heading text-lg text-white">Feedback Ledger</h3>
                            <span className="badge badge-success">{formatPercent(s.successRate)} success</span>
                        </div>

                        <div className="flex items-end gap-3 mb-4">
                            <span className="font-heading text-5xl leading-[0.85] text-white tabular-nums">
                                {totalFeedbacks.toLocaleString()}
                            </span>
                            <div className="flex flex-col pb-1 leading-tight">
                                <span className="text-2xs uppercase tracking-[0.2em] text-subtle">Total</span>
                                <span className="text-2xs uppercase tracking-[0.2em] text-subtle">Feedbacks</span>
                            </div>
                        </div>

                        {/* Composition — what all the feedback is made of */}
                        <div className="flex flex-col gap-2">
                            <span className="text-3xs uppercase tracking-[0.18em] text-subtle">Composition</span>
                            {s.classDistribution && Object.keys(s.classDistribution).length > 0 ? (
                                <>
                                    <div className="flex h-2.5 rounded-full overflow-hidden bg-white/5">
                                        {Object.entries(s.classDistribution).map(([k, v]) => (
                                            <div
                                                key={k}
                                                title={`${feedbackCategoryDisplayLabel(k)}: ${v}`}
                                                className="h-full transition-[filter] hover:brightness-125"
                                                style={{
                                                    width: `${(v / feedDenom) * 100}%`,
                                                    background: categoryGradient(k),
                                                }}
                                            />
                                        ))}
                                    </div>
                                    <div className="flex flex-wrap gap-x-5 gap-y-1 text-2xs">
                                        {Object.entries(s.classDistribution).map(([k, v]) => (
                                            <span key={k} className="flex items-center gap-1.5 text-muted">
                                                <span
                                                    className="w-1.5 h-1.5 rounded-full"
                                                    style={{ background: categoryColor(k) }}
                                                />
                                                <span className="capitalize">{feedbackCategoryDisplayLabel(k)}</span>
                                                <span className="text-white font-semibold tabular-nums">{v.toLocaleString()}</span>
                                            </span>
                                        ))}
                                    </div>
                                </>
                            ) : (
                                <span className="text-2xs text-subtle">No classified feedback yet</span>
                            )}
                        </div>

                        {/* Outcome — Quality feedbacks outcome, scaled by tasks/quality subset */}
                        <div className="flex flex-col gap-2 mt-3">
                            <span className="text-3xs uppercase tracking-[0.18em] text-subtle flex items-center gap-1.5">
                                <span className="text-accent not-italic">↳</span>
                                Quality feedbacks
                                <span className="text-muted normal-case tracking-normal tabular-nums">{s.totalTasks.toLocaleString()}</span>
                            </span>
                            <div className="flex h-2.5 rounded-full overflow-hidden bg-white/5">
                                <div
                                    title={`Passed: ${s.totalPassed}`}
                                    className="h-full transition-[filter] hover:brightness-125"
                                    style={{ width: `${passedPct}%`, background: GRAD_PASSED }}
                                />
                                <div
                                    title={`Failed: ${s.totalFailed}`}
                                    className="h-full transition-[filter] hover:brightness-125"
                                    style={{ width: `${failedPct}%`, background: GRAD_FAILED }}
                                />
                            </div>
                            <div className="flex flex-wrap gap-x-5 gap-y-1 text-2xs">
                                <span className="flex items-center gap-1.5 text-muted">
                                    <span className="w-1.5 h-1.5 rounded-full bg-success" />
                                    Passed
                                    <span className="text-white font-semibold tabular-nums">{s.totalPassed.toLocaleString()}</span>
                                </span>
                                <span className="flex items-center gap-1.5 text-muted">
                                    <span className="w-1.5 h-1.5 rounded-full bg-danger" />
                                    Failed
                                    <span className="text-white font-semibold tabular-nums">{s.totalFailed.toLocaleString()}</span>
                                </span>
                            </div>
                        </div>

                        {/* Reliability rollup pinned to the bottom edge */}
                        <div className="mt-auto pt-3 flex items-center gap-10 border-t border-border">
                            <div className="flex flex-col gap-0.5">
                                <span className={`text-base font-bold tabular-nums ${s.consecutiveFails > 0 ? 'text-danger' : 'text-success'}`}>
                                    {s.consecutiveFails}
                                </span>
                                <span className="text-3xs uppercase tracking-[0.15em] text-subtle">Cons. Fails</span>
                            </div>
                            <div className="flex flex-col gap-0.5">
                                <span className="text-base font-bold tabular-nums text-accent">{s.penalty.toFixed(1)}%</span>
                                <span className="text-3xs uppercase tracking-[0.15em] text-subtle">Reliability Penalty</span>
                            </div>
                        </div>
                    </div>

                    {/* RIGHT — skill radar balances the visual weight */}
                    <AgentRadarChart data={radar} />
                </div>
            ) : (
                <AgentRadarChart data={radar} />
            )}
            <TrustScoreChart points={trustHistory} />
            <ActivityHeatmap data={heatmap} />
        </div>
    );
}
