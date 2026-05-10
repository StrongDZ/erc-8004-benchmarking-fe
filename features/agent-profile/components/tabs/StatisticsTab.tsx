'use client';
import { useEffect, useState } from 'react';
import { api, AgentProfile, HeatmapDay, ScorePoint, formatPercent } from '@/shared/api/client';
import TrustScoreChart from '@/features/agent-profile/components/TrustScoreChart';
import ActivityHeatmap from '@/features/agent-profile/components/ActivityHeatmap';
import { Skeleton } from '@/shared/ui/Skeleton';

interface Props { chainId: number; agentId: string; }

export default function StatisticsTab({ chainId, agentId }: Props) {
    const [profile, setProfile] = useState<AgentProfile | null>(null);
    const [history, setHistory] = useState<ScorePoint[]>([]);
    const [heatmap, setHeatmap] = useState<HeatmapDay[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        setLoading(true);
        Promise.all([
            api.agentProfile(chainId, agentId).then(r => setProfile(r.data ?? null)),
            api.scoreHistory(chainId, agentId, '1d').then(r => setHistory(r.data?.points ?? [])),
            api.activityHeatmap(chainId, agentId).then(r => setHeatmap(r.data ?? [])),
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

    return (
        <div className="flex flex-col gap-6">
            {/* Scoring stats grid (moved from AgentHero) */}
            {s && (
                <div className="card p-5">
                    <h3 className="font-heading text-lg text-white mb-4">Scoring Stats</h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2">
                        {[
                            { label: 'Total Tasks', value: s.totalTasks.toLocaleString(), color: 'text-white' },
                            { label: 'Success Rate', value: formatPercent(s.successRate), color: 'text-success' },
                            { label: 'Passed', value: s.totalPassed.toLocaleString(), color: 'text-white' },
                            { label: 'Failed', value: s.totalFailed.toLocaleString(), color: 'text-danger' },
                            { label: 'Cons. Fails', value: s.consecutiveFails, color: s.consecutiveFails > 0 ? 'text-danger' : 'text-success' },
                            { label: 'Penalty', value: s.penalty.toFixed(1), color: 'text-accent' },
                        ].map(item => (
                            <div
                                key={item.label}
                                className="bg-black/40 border border-border rounded-md px-3 py-2 flex flex-col"
                            >
                                <span className={`text-lg font-bold font-heading ${item.color}`}>{item.value}</span>
                                <span className="text-[10px] uppercase tracking-wider text-subtle">{item.label}</span>
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
                                            style={{ width: `${(v / Math.max(1, s.totalTasks)) * 100}%` }}
                                        />
                                    </div>
                                    <span className="w-8 text-right text-muted tabular-nums">{v}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* TrustScore evolution */}
            <TrustScoreChart points={history} />

            {/* Activity heatmap */}
            <ActivityHeatmap data={heatmap} />
        </div>
    );
}
