'use client';
import { useEffect, useState } from 'react';
import { api, AgentProfile, HeatmapDay, RadarData, TrustScorePoint, formatPercent } from '@/shared/api/client';
import TrustScoreChart from '@/features/agent-profile/components/TrustScoreChart';
import ActivityHeatmap from '@/features/agent-profile/components/ActivityHeatmap';
import AgentRadarChart from '@/features/agent-profile/components/SkillRadarChart';
import { ScoreBreakdownPanel } from '@/features/agent-profile/components/ScoreBreakdownPanel';
import { Skeleton } from '@/shared/ui/Skeleton';

interface Props { chainId: number; agentId: string; }

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

    return (
        <div className="flex flex-col gap-6">
            {s && (
                <ScoreBreakdownPanel
                    breakdown={s.scoreBreakdown}
                    compositeScore={s.trustScore}
                    qualityPresent={qualityPresent}
                />
            )}

            {s && (
                <div className="card p-5">
                    <h3 className="font-heading text-lg text-white mb-4">Task & Feedback Stats</h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-7 gap-2">
                        {[
                            { label: 'Total Feedbacks', value: totalFeedbacks.toLocaleString(), color: 'text-white' },
                            { label: 'Total Tasks', value: s.totalTasks.toLocaleString(), color: 'text-white' },
                            { label: 'Success Rate', value: formatPercent(s.successRate), color: 'text-success' },
                            { label: 'Passed', value: s.totalPassed.toLocaleString(), color: 'text-white' },
                            { label: 'Failed', value: s.totalFailed.toLocaleString(), color: 'text-danger' },
                            { label: 'Cons. Fails', value: s.consecutiveFails, color: s.consecutiveFails > 0 ? 'text-danger' : 'text-success' },
                            { label: 'Reliability Penalty', value: `${s.penalty.toFixed(1)}%`, color: 'text-accent' },
                        ].map(item => (
                            <div
                                key={item.label}
                                className="bg-black/40 border border-border rounded-md px-3 py-2 flex flex-col"
                            >
                                <span className={`text-lg font-bold font-body tabular-nums ${item.color}`}>{item.value}</span>
                                <span className="text-3xs uppercase tracking-wider text-subtle">{item.label}</span>
                            </div>
                        ))}
                    </div>

                    {s.classDistribution && Object.keys(s.classDistribution).length > 0 && (
                        <div className="flex flex-col gap-1.5 mt-5">
                            <span className="text-xs uppercase tracking-wider text-subtle mb-1">
                                Class Distribution
                            </span>
                            {Object.entries(s.classDistribution).map(([k, v]) => (
                                <div key={k} className="flex items-center gap-2 text-xs">
                                    <span className="w-28 capitalize text-muted">{k.replace('_', ' ')}</span>
                                    <div className="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-accent"
                                            style={{ width: `${(v / Math.max(1, totalFeedbacks)) * 100}%` }}
                                        />
                                    </div>
                                    <span className="w-8 text-right text-muted tabular-nums">{v}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            <AgentRadarChart data={radar} />
            <TrustScoreChart points={trustHistory} />
            <ActivityHeatmap data={heatmap} />
        </div>
    );
}
