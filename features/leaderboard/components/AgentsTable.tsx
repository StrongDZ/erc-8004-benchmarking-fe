'use client';
// features/leaderboard/components/AgentsTable.tsx
// New-dashboard table with columns: Name | Chain | Service | Score | Feedback | Owner | Created.
// Replaces LeaderboardTable for the redesigned dashboard (existing component is kept
// for admin/detail screens that still rely on rank/success-rate/age columns).

import { useRouter } from 'next/navigation';
import { AgentService, LeaderboardAgent, explorerAddressUrl, resolveIPFS, truncateAddress } from '@/shared/api/client';
import { Badge } from '@/shared/ui/Badge';

interface Props {
    agents: LeaderboardAgent[];
    chains?: { chainId: number; shortName: string; name: string }[];
    loading?: boolean;
}

function fallbackImg(e: React.SyntheticEvent<HTMLImageElement>) {
    (e.target as HTMLImageElement).src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"%3E%3Crect width="100" height="100" fill="%231E293B"/%3E%3C/svg%3E';
}

function formatCreated(ts?: number): string {
    if (!ts) return '—';
    const diff = Date.now() - ts * 1000;
    const sec = Math.floor(diff / 1000);
    if (sec < 60) return 'just now';
    const min = Math.floor(sec / 60);
    if (min < 60) return `${min}m ago`;
    const hr = Math.floor(min / 60);
    if (hr < 24) return `${hr}h ago`;
    const d = Math.floor(hr / 24);
    if (d < 30) return `${d}d ago`;
    return new Date(ts * 1000).toLocaleDateString();
}

function serviceBadges(services?: AgentService[]) {
    if (!services?.length) return <span className="text-muted text-xs">—</span>;
    return (
        <div className="flex flex-wrap gap-1">
            {services.slice(0, 3).map((s) => (
                <span key={s.name} className="inline-flex items-center px-1.5 py-0.5 text-[10px] font-semibold rounded bg-primary/15 border border-primary/30 text-primary uppercase">
                    {s.name}
                </span>
            ))}
            {services.length > 3 && <span className="text-xs text-muted">+{services.length - 3}</span>}
        </div>
    );
}

export default function AgentsTable({ agents, chains = [], loading }: Props) {
    const router = useRouter();
    const chainMap = new Map(chains.map((c) => [c.chainId, c]));

    if (loading) {
        return (
            <div className="flex flex-col gap-2">
                {Array.from({ length: 10 }).map((_, i) => (
                    <div key={i} className="skeleton h-14 w-full rounded-md" style={{ animationDelay: `${i * 0.04}s` }} />
                ))}
            </div>
        );
    }

    if (!agents.length) {
        return (
            <div className="text-center py-16 text-muted">
                <p className="font-medium">No agents match your filters.</p>
                <p className="text-xs mt-1 text-subtle">Try clearing some filters to expand the result set.</p>
            </div>
        );
    }

    return (
        <div className="w-full overflow-x-auto rounded-lg border border-border bg-black/20">
            <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="bg-black/40 text-muted uppercase text-xs sticky top-0 font-semibold tracking-wider">
                    <tr>
                        <th className="px-5 py-3 font-medium border-b border-white/5">Name</th>
                        <th className="px-5 py-3 font-medium border-b border-white/5">Chain</th>
                        <th className="px-5 py-3 font-medium border-b border-white/5">Service</th>
                        <th className="px-5 py-3 font-medium border-b border-white/5 text-right">Score</th>
                        <th className="px-5 py-3 font-medium border-b border-white/5 text-right">Feedback</th>
                        <th className="px-5 py-3 font-medium border-b border-white/5">Owner</th>
                        <th className="px-5 py-3 font-medium border-b border-white/5 text-right">Created</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                    {agents.map((a) => {
                        const chain = chainMap.get(a.chainId);
                        return (
                            <tr
                                key={`${a.chainId}:${a.agentId}`}
                                onClick={() => router.push(`/agents/${a.chainId}/${a.agentId}`)}
                                className="hover:bg-white/5 cursor-pointer transition-colors group"
                            >
                                <td className="px-5 py-3">
                                    <div className="flex items-center gap-3">
                                        <img
                                            src={resolveIPFS(a.image)}
                                            alt={a.name}
                                            className="w-9 h-9 rounded-full border border-border group-hover:border-primary transition-colors"
                                            onError={fallbackImg}
                                        />
                                        <div className="flex flex-col">
                                            <span className="font-semibold text-white group-hover:text-primary transition-colors">{a.name || `Agent #${a.agentId}`}</span>
                                            <span className="text-xs text-muted">#{a.agentId}</span>
                                        </div>
                                        {a.hasOASF && <Badge variant="success" className="text-[10px] py-0 px-1.5 ml-1">OASF</Badge>}
                                        {a.x402Support && <Badge variant="primary" className="text-[10px] py-0 px-1.5">x402</Badge>}
                                    </div>
                                </td>
                                <td className="px-5 py-3">
                                    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-white/5 border border-border text-xs text-white">
                                        <span className="w-1.5 h-1.5 rounded-full bg-success" />
                                        {chain?.shortName || chain?.name || a.chainId}
                                    </span>
                                </td>
                                <td className="px-5 py-3">{serviceBadges(a.services)}</td>
                                <td className="px-5 py-3 text-right">
                                    <span className="font-bold text-primary tabular-nums">{a.trustScore.toFixed(1)}</span>
                                </td>
                                <td className="px-5 py-3 text-right text-white tabular-nums">{a.totalTasks.toLocaleString()}</td>
                                <td className="px-5 py-3">
                                    {a.owner ? (
                                        <a
                                            href={explorerAddressUrl(a.chainId, a.owner)}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            onClick={(e) => e.stopPropagation()}
                                            className="font-mono text-xs text-muted hover:text-primary transition-colors"
                                        >
                                            {truncateAddress(a.owner)}
                                        </a>
                                    ) : (
                                        <span className="text-muted text-xs">—</span>
                                    )}
                                </td>
                                <td className="px-5 py-3 text-right text-xs text-subtle">{formatCreated(a.createdAt)}</td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
}
