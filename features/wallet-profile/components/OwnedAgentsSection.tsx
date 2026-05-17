'use client';
import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Chain, LeaderboardAgent, resolveIPFS } from '@/shared/api/client';
import { FALLBACK_AVATAR_DATA_URI } from '@/shared/constants/app';
import { Badge } from '@/shared/ui/Badge';
import { ChainBadge } from '@/shared/ui/ChainBadge';
import PageNavigation from '@/shared/ui/PageNavigation';

interface Props {
    agents: LeaderboardAgent[];
    chains?: Chain[];
    loading: boolean;
    /** When the wallet route changes, pagination resets to page 1 */
    walletAddress?: string;
}

function fallbackImg(e: React.SyntheticEvent<HTMLImageElement>) {
    (e.target as HTMLImageElement).src = FALLBACK_AVATAR_DATA_URI;
}

const PAGE_SIZE = 10;

export default function OwnedAgentsSection({ agents, chains = [], loading, walletAddress }: Props) {
    const [page, setPage] = useState(1);
    const chainMap = useMemo(() => new Map(chains.map((c) => [c.chainId, c])), [chains]);

    useEffect(() => {
        setPage(1);
    }, [walletAddress]);

    const totalPages = Math.max(1, Math.ceil(agents.length / PAGE_SIZE));

    useEffect(() => {
        if (page > totalPages) setPage(totalPages);
    }, [page, totalPages]);

    const pageAgents = useMemo(() => {
        const start = (page - 1) * PAGE_SIZE;
        return agents.slice(start, start + PAGE_SIZE);
    }, [agents, page]);

    const padRows = Math.max(0, PAGE_SIZE - pageAgents.length);

    return (
        <div className="card p-5">
            <h2 className="font-heading text-lg text-white flex items-center gap-2 mb-4">
                Owned Agents
                {!loading && (
                    <span className="text-sm font-normal text-muted bg-white/5 px-2 py-0.5 rounded-md">
                        {agents.length}
                    </span>
                )}
            </h2>

            {loading ? (
                <div className="flex flex-col gap-2">
                    {Array.from({ length: 3 }).map((_, i) => (
                        <div key={i} className="skeleton h-14 w-full rounded-md" style={{ animationDelay: `${i * 0.05}s` }} />
                    ))}
                </div>
            ) : agents.length === 0 ? (
                <p className="text-sm text-muted py-8 text-center">
                    No registered agents found for this wallet address.
                </p>
            ) : (
                <>
                    <div className="w-full overflow-x-auto rounded-lg border border-border bg-black/20">
                        <table className="data-table w-full table-fixed text-left text-sm">
                            <thead className="bg-black/40 text-muted uppercase text-xs sticky top-0 font-semibold tracking-wider">
                                <tr>
                                    <th className="w-[42%] px-4 py-2.5 font-medium border-b border-white/5">Agent</th>
                                    <th className="w-[17%] px-4 py-2.5 font-medium border-b border-white/5">Chain</th>
                                    <th className="w-[13%] px-4 py-2.5 font-medium border-b border-white/5 text-right">Score</th>
                                    <th className="w-[13%] px-4 py-2.5 font-medium border-b border-white/5 text-right">Tasks</th>
                                    <th className="w-[15%] px-4 py-2.5 font-medium border-b border-white/5 text-center">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {pageAgents.map((a) => {
                                    const chain = chainMap.get(a.chainId);
                                    return (
                                        <tr
                                            key={`${a.chainId}:${a.agentId}`}
                                            className="hover:bg-white/5 transition-colors group"
                                        >
                                            <td className="max-w-0 px-4 py-2.5 align-middle">
                                                <Link
                                                    href={`/agents/${a.chainId}/${a.agentId}`}
                                                    className="flex items-center gap-2 min-w-0"
                                                >
                                                    <img
                                                        src={resolveIPFS(a.image)}
                                                        alt=""
                                                        className="h-8 w-8 shrink-0 rounded-full border border-border group-hover:border-primary transition-colors"
                                                        onError={fallbackImg}
                                                    />
                                                    <div className="min-w-0 flex-1">
                                                        <p
                                                            className="truncate text-sm font-semibold text-white group-hover:text-primary transition-colors"
                                                            title={a.name}
                                                        >
                                                            {a.name || `Agent #${a.agentId}`}
                                                        </p>
                                                        <p className="truncate text-[11px] text-subtle">#{a.agentId}</p>
                                                    </div>
                                                </Link>
                                            </td>
                                            <td className="max-w-0 px-4 py-2.5 align-middle overflow-hidden">
                                                <div className="min-w-0">
                                                    <ChainBadge
                                                        chainId={a.chainId}
                                                        chain={chain}
                                                        size="sm"
                                                        className="max-w-full"
                                                    />
                                                </div>
                                            </td>
                                            <td className="max-w-0 px-4 py-2.5 text-right align-middle tabular-nums">
                                                <span className="font-bold text-primary">{a.trustScore.toFixed(1)}</span>
                                            </td>
                                            <td className="max-w-0 px-4 py-2.5 text-right align-middle tabular-nums text-white">
                                                {a.totalTasks.toLocaleString()}
                                            </td>
                                            <td className="max-w-0 px-4 py-2.5 text-center align-middle">
                                                <Badge variant={a.active ? 'success' : 'danger'} size="xs">
                                                    {a.active ? 'Active' : 'Inactive'}
                                                </Badge>
                                            </td>
                                        </tr>
                                    );
                                })}
                                {Array.from({ length: padRows }).map((_, i) => (
                                    <tr key={`_pad_${i}`} aria-hidden className="pointer-events-none select-none">
                                        <td colSpan={5} className="border-b border-white/5 bg-transparent px-4 py-2.5">
                                            <div className="h-8" />
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    {agents.length > PAGE_SIZE && (
                        <PageNavigation
                            className="mt-6 border-t border-border pt-4"
                            page={page}
                            totalPages={totalPages}
                            onPageChange={setPage}
                        />
                    )}
                </>
            )}
        </div>
    );
}
