'use client';
// features/leaderboard/components/OverviewStats.tsx
// Right-hand summary card: total agents, active agents, total feedback.
// Uses multi-chain stats endpoint so it reflects the currently filtered chain scope.

import { useEffect, useMemo, useState } from 'react';
import { Activity, Database, Users } from 'lucide-react';
import { api, LeaderboardStats } from '@/shared/api/client';
import { useChain } from '@/providers/ChainProvider';
import { Skeleton } from '@/shared/ui/Skeleton';
import { ChainBadge } from '@/shared/ui/ChainBadge';

interface Props {
    chainIds: number[]; // empty = all chains
}

export default function OverviewStats({ chainIds }: Props) {
    const { chains } = useChain();
    const chainMap = useMemo(() => new Map(chains.map((c) => [c.chainId, c])), [chains]);
    const [stats, setStats] = useState<LeaderboardStats | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let cancelled = false;
        setLoading(true);
        api.leaderboardStatsMulti(chainIds).then((r) => {
            if (cancelled) return;
            if (r.success) setStats(r.data);
            setLoading(false);
        });
        return () => { cancelled = true; };
    }, [chainIds.join(',')]); // eslint-disable-line react-hooks/exhaustive-deps

    if (loading || !stats) {
        return (
            <div className="bg-card border border-border rounded-xl p-5 h-full flex flex-col gap-3 min-h-[340px]">
                <Skeleton className="h-6 w-40 rounded-md" />
                <div className="grid grid-cols-1 gap-3 mt-2">
                    {Array.from({ length: 3 }).map((_, i) => (
                        <Skeleton key={i} className="h-20 w-full rounded-lg" />
                    ))}
                </div>
            </div>
        );
    }

    const activePct = stats.totalAgents > 0 ? (stats.activeAgents / stats.totalAgents) * 100 : 0;

    return (
        <div className="bg-card border border-border rounded-xl p-5 h-full flex flex-col min-h-[340px]">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-white/5">
                <h2 className="text-base font-bold text-white">Overview</h2>
                <div className="flex flex-wrap items-center justify-end gap-1.5 max-w-[min(100%,14rem)]">
                    {chainIds.length === 0 ? (
                        <span className="text-xs text-muted">All chains</span>
                    ) : (
                        chainIds.map((id) => (
                            <ChainBadge key={id} chainId={id} chain={chainMap.get(id)} size="sm" />
                        ))
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 gap-3 flex-1">
                <StatRow
                    icon={<Users size={18} className="text-primary" />}
                    label="Total Agents"
                    value={stats.totalAgents.toLocaleString()}
                    accent="primary"
                />
                <StatRow
                    icon={<Activity size={18} className="text-success" />}
                    label="Active Agents"
                    value={stats.activeAgents.toLocaleString()}
                    sub={`${activePct.toFixed(1)}% active`}
                    accent="success"
                />
                <StatRow
                    icon={<Database size={18} className="text-accent" />}
                    label="Total Feedback"
                    value={stats.totalFeedbacks.toLocaleString()}
                    sub={`Last block #${stats.lastBlockIndexed?.toLocaleString() ?? '—'}`}
                    accent="accent"
                />
            </div>
        </div>
    );
}

function StatRow({ icon, label, value, sub, accent }: { icon: React.ReactNode; label: string; value: string; sub?: string; accent: 'primary' | 'success' | 'accent' }) {
    const border =
        accent === 'primary' ? 'border-primary/30' :
        accent === 'success' ? 'border-success/30' : 'border-accent/30';
    return (
        <div className={`flex items-center gap-4 bg-black/30 border ${border} rounded-lg p-4`}>
            <div className="p-2.5 rounded-lg bg-white/5 flex-shrink-0">{icon}</div>
            <div className="flex flex-col flex-1 min-w-0">
                <span className="text-xs text-muted uppercase tracking-wider font-semibold">{label}</span>
                <span className="text-2xl font-bold font-heading text-white leading-tight tabular-nums">{value}</span>
                {sub && <span className="text-xs text-subtle mt-0.5 truncate">{sub}</span>}
            </div>
        </div>
    );
}
