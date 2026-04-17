'use client';
// app/(dashboard)/page.tsx — 4-row dashboard.
// Row 1: Realtime Event Feed + Overview Stats
// Row 2: New Agents horizontal strip
// Row 3: Filters (multi-select)
// Row 4: Agents table (Name | Chain | Service | Score | Feedback | Owner | Created)

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import { api, LeaderboardAgent, LeaderboardQuery } from '@/shared/api/client';
import { useChain } from '@/providers/ChainProvider';
import { Button } from '@/shared/ui/Button';
import { Badge } from '@/shared/ui/Badge';
import RealtimeEventFeed from '@/features/leaderboard/components/RealtimeEventFeed';
import OverviewStats from '@/features/leaderboard/components/OverviewStats';
import NewAgentsStrip from '@/features/leaderboard/components/NewAgentsStrip';
import DashboardFilters, { DashboardFilterValue } from '@/features/leaderboard/components/DashboardFilters';
import AgentsTable from '@/features/leaderboard/components/AgentsTable';

type SortKey = NonNullable<LeaderboardQuery['sort']>;

const EMPTY_FILTER: DashboardFilterValue = {
    chainIds: [],
    services: [],
    oasfSkills: [],
    oasfDomains: [],
    tags: [],
    x402: undefined,
};

export default function HomePage() {
    const { chains } = useChain();

    const [filter, setFilter] = useState<DashboardFilterValue>(EMPTY_FILTER);
    const [query, setQuery] = useState('');
    const [sort, setSort] = useState<SortKey>('score_desc');
    const [page, setPage] = useState(1);
    const [limit] = useState(50);

    const [agents, setAgents] = useState<LeaderboardAgent[]>([]);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(true);

    // effective chain scope — empty means "all chains" for stats & new-agents queries.
    const effectiveChainIds = filter.chainIds;

    const queryKey = useMemo(
        () => JSON.stringify({ filter, query, sort, page, limit }),
        [filter, query, sort, page, limit],
    );

    const loadAgents = useCallback(async () => {
        setLoading(true);
        const r = await api.leaderboardQuery({
            chainIds: filter.chainIds,
            skills: filter.oasfSkills,
            domains: filter.oasfDomains,
            services: filter.services,
            tags: filter.tags,
            x402: filter.x402,
            query: query || undefined,
            sort,
            page,
            limit,
        });
        if (r.success) {
            setAgents(r.data ?? []);
            setTotal(r.meta?.total ?? 0);
        } else {
            setAgents([]);
            setTotal(0);
        }
        setLoading(false);
    }, [filter, query, sort, page, limit]);

    useEffect(() => { loadAgents(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [queryKey]);

    // Reset page when filters/search/sort change.
    useEffect(() => { setPage(1); }, [filter, query, sort]);

    const totalPages = Math.max(1, Math.ceil(total / limit));
    const activeFilterCount =
        filter.chainIds.length + filter.services.length + filter.oasfSkills.length +
        filter.oasfDomains.length + filter.tags.length + (filter.x402 !== undefined ? 1 : 0);

    return (
        <div className="container max-w-[1400px] mx-auto px-4 md:px-8 py-8 fade-in">
            {/* Page header */}
            <header className="mb-8">
                <h1 className="text-3xl md:text-4xl font-bold font-heading mb-2 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                    Agent Dashboard
                </h1>
                <p className="text-muted text-sm max-w-2xl">
                    Realtime ERC-8004 event stream, fresh agent registrations, and TrustRank leaderboard — all in one place.
                </p>
            </header>

            {/* Row 1: Realtime + Stats */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
                <div className="lg:col-span-2">
                    <RealtimeEventFeed />
                </div>
                <div>
                    <OverviewStats chainIds={effectiveChainIds} />
                </div>
            </div>

            {/* Row 2: New agents strip */}
            <div className="mb-6">
                <NewAgentsStrip chainIds={effectiveChainIds} />
            </div>

            {/* Row 3: Filters */}
            <div className="mb-6">
                <DashboardFilters chains={chains} value={filter} onChange={setFilter} />
            </div>

            {/* Row 4: Agents table */}
            <div className="bg-background/50 border border-border rounded-xl p-4 md:p-5 shadow-xl backdrop-blur-sm">
                <div className="flex flex-wrap items-center justify-between gap-3 mb-4 pb-3 border-b border-white/5">
                    <div className="flex bg-black/40 border border-border rounded-md px-3 py-2 items-center flex-1 min-w-[240px] max-w-sm focus-within:border-primary transition-colors">
                        <Search size={14} className="text-muted shrink-0 mr-2" />
                        <input
                            className="bg-transparent border-none outline-none text-white w-full placeholder:text-muted/60 text-sm"
                            placeholder="Search by name or description…"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                        />
                    </div>
                    <div className="flex items-center gap-3">
                        <select
                            className="bg-black/40 border border-border text-white px-3 py-2 rounded-md outline-none focus:border-primary transition-colors text-sm"
                            value={sort}
                            onChange={(e) => setSort(e.target.value as SortKey)}
                        >
                            <option value="score_desc">Score ↓</option>
                            <option value="score_asc">Score ↑</option>
                            <option value="tasks_desc">Most Feedback</option>
                            <option value="recent">Newest</option>
                        </select>
                        <span className="text-sm text-muted font-medium">
                            {loading ? 'Loading…' : `${total.toLocaleString()} agents`}
                        </span>
                        {activeFilterCount > 0 && (
                            <Badge variant="accent">Filtered</Badge>
                        )}
                    </div>
                </div>

                <AgentsTable agents={agents} chains={chains} loading={loading} />

                {totalPages > 1 && (
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6 pt-4 border-t border-border">
                        <div className="flex gap-1 text-sm">
                            <Button
                                variant="outline"
                                className="border-border text-muted hover:text-white disabled:opacity-30"
                                onClick={() => setPage((p) => Math.max(1, p - 1))}
                                disabled={page === 1}
                            >
                                Prev
                            </Button>
                            {Array.from({ length: Math.min(totalPages, 7) }).map((_, i) => {
                                const p = i + 1;
                                return (
                                    <button
                                        key={p}
                                        className={`w-8 py-1.5 rounded-md transition-all ${page === p ? 'bg-primary text-black font-bold' : 'text-muted hover:text-white hover:bg-white/5'}`}
                                        onClick={() => setPage(p)}
                                    >
                                        {p}
                                    </button>
                                );
                            })}
                            {totalPages > 7 && <span className="px-2 py-1.5 text-muted">…</span>}
                            <Button
                                variant="outline"
                                className="border-border text-muted hover:text-white disabled:opacity-30"
                                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                                disabled={page === totalPages}
                            >
                                Next
                            </Button>
                        </div>
                        <span className="text-sm text-subtle font-medium">
                            Page {page} of {totalPages}
                        </span>
                    </div>
                )}
            </div>
        </div>
    );
}
