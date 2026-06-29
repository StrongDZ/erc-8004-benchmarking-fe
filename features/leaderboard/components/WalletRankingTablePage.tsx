'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, Wallet } from 'lucide-react';
import { api, LeaderboardAgent, resolveIPFS } from '@/shared/api/client';
import { FALLBACK_AVATAR_DATA_URI } from '@/shared/constants/app';
import { useChain } from '@/providers/ChainProvider';
import PageNavigation from '@/shared/ui/PageNavigation';
import { Skeleton } from '@/shared/ui/Skeleton';
import { AddressLabel } from '@/shared/ui/AddressLabel';

const PAGE_SIZE = 15;
const MAX_AGENT_AVATARS = 3;

interface WalletRow {
    address: string;
    agents: LeaderboardAgent[];
    trustScore: number | null;
    feedbackTotalCount: number;
}

function fallbackImg(e: React.SyntheticEvent<HTMLImageElement>) {
    (e.target as HTMLImageElement).src = FALLBACK_AVATAR_DATA_URI;
}

function AgentAvatarStack({ agents }: { agents: LeaderboardAgent[] }) {
    const shown = agents.slice(0, MAX_AGENT_AVATARS);
    const extra = agents.length - shown.length;
    return (
        <div className="flex items-center">
            <div className="flex -space-x-2">
                {shown.map((a) => (
                    <Link
                        key={`${a.chainId}:${a.agentId}`}
                        href={`/agents/${a.chainId}/${a.agentId}`}
                        onClick={(e) => e.stopPropagation()}
                        title={a.name || a.agentId}
                        className="relative shrink-0 hover:z-10"
                    >
                        <img
                            src={resolveIPFS(a.image)}
                            alt={a.name || a.agentId}
                            className="h-7 w-7 rounded-full border-2 border-background object-cover transition-transform hover:scale-110"
                            onError={fallbackImg}
                        />
                    </Link>
                ))}
            </div>
            {extra > 0 && (
                <span className="ml-1.5 text-xs font-semibold text-muted">+{extra}</span>
            )}
        </div>
    );
}

export default function WalletRankingTablePage() {
    const { chains } = useChain();
    const defaultChainIds = useMemo(() => chains.map((c) => c.chainId), [chains]);

    const [rows, setRows] = useState<WalletRow[]>([]);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const loadSeq = useRef(0);

    const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

    const load = useCallback(async () => {
        if (defaultChainIds.length === 0) return;
        const seq = ++loadSeq.current;
        setLoading(true);

        const res = await api.walletRanking(defaultChainIds, page, PAGE_SIZE);

        if (!res.success || !res.data) {
            if (seq !== loadSeq.current) return;
            setRows([]);
            setTotal(0);
            setLoading(false);
            return;
        }

        if (seq !== loadSeq.current) return;

        setRows(
            res.data.map((row) => ({
                address: row.address,
                agents: row.agents,
                trustScore: row.trustScore,
                feedbackTotalCount: row.feedbackTotalCount,
            })),
        );
        setTotal(res.meta?.total ?? res.data.length);
        setLoading(false);
    }, [defaultChainIds, page]);

    useEffect(() => {
        load();
    }, [load]);

    const globalRank = (i: number) => (page - 1) * PAGE_SIZE + i + 1;

    return (
        <div className="fade-in container mx-auto max-w-[1200px] px-4 py-8 md:px-8">
            <div className="mb-8">
                <Link
                    href="/"
                    className="mb-4 inline-flex items-center gap-2 text-sm text-muted transition-colors hover:text-primary"
                >
                    <ArrowLeft size={16} />
                    Back to dashboard
                </Link>
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10 border border-primary/20">
                        <Wallet size={20} className="text-primary" />
                    </div>
                    <div>
                        <h1 className="font-heading text-3xl font-bold text-white md:text-4xl">Wallet Ranking</h1>
                        <p className="mt-1 text-sm text-muted">
                            Wallets ranked by trust score. Includes owned agents and feedback activity.
                        </p>
                    </div>
                </div>
            </div>

            <div className="mb-4 flex items-center justify-between">
                <span className="text-sm text-muted">
                    {loading ? 'Loading…' : `${total.toLocaleString()} wallets`}
                </span>
            </div>

            <div className="overflow-hidden rounded-xl border border-border bg-black/20">
                <div className="w-full overflow-x-auto">
                    <table className="data-table w-full min-w-[720px] table-fixed text-left text-sm">
                        <thead className="sticky top-0 bg-black/50 text-xs font-semibold uppercase tracking-wider text-muted">
                            <tr>
                                <th className="w-[6%] border-b border-white/5 px-4 py-3">#</th>
                                <th className="w-[32%] border-b border-white/5 px-4 py-3">Address</th>
                                <th className="w-[26%] border-b border-white/5 px-4 py-3">Owned Agents</th>
                                <th className="w-[18%] border-b border-white/5 px-4 py-3 text-right">Feedbacks Given</th>
                                <th className="w-[18%] border-b border-white/5 px-4 py-3 text-right">Trust Score</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {loading &&
                                Array.from({ length: PAGE_SIZE }).map((_, i) => (
                                    <tr key={i}>
                                        <td colSpan={5} className="px-4 py-3">
                                            <Skeleton className="h-10 w-full rounded-md" />
                                        </td>
                                    </tr>
                                ))}
                            {!loading && rows.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="px-4 py-12 text-center text-muted">
                                        No wallet data available.
                                    </td>
                                </tr>
                            )}
                            {!loading &&
                                rows.map((row, i) => (
                                    <tr key={row.address} className="hover:bg-white/[0.03] transition-colors">
                                        <td className="px-4 py-3 font-mono text-xs text-muted tabular-nums">
                                            {globalRank(i)}
                                        </td>
                                        <td className="px-4 py-3">
                                            <AddressLabel
                                                address={row.address}
                                                className="font-mono text-xs text-white hover:text-primary transition-colors"
                                            />
                                        </td>
                                        <td className="px-4 py-3">
                                            {row.agents.length > 0 ? (
                                                <AgentAvatarStack agents={row.agents} />
                                            ) : (
                                                <span className="text-xs text-muted">—</span>
                                            )}
                                        </td>
                                        <td className="px-4 py-3 text-right tabular-nums text-white">
                                            {row.feedbackTotalCount.toLocaleString()}
                                        </td>
                                        <td className="px-4 py-3 text-right tabular-nums">
                                            {row.trustScore !== null ? (
                                                <span className="font-bold text-primary">
                                                    {row.trustScore.toFixed(1)}
                                                    <span className="text-3xs font-normal text-muted ml-0.5">/100</span>
                                                </span>
                                            ) : (
                                                <span className="text-xs uppercase tracking-wider text-subtle font-semibold">Unrated</span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {total > PAGE_SIZE && (
                <PageNavigation
                    className="mt-6 border-t border-border pt-4"
                    page={page}
                    totalPages={totalPages}
                    loading={loading}
                    onPageChange={setPage}
                />
            )}
        </div>
    );
}
