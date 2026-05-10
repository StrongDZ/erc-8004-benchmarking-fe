"use client";
// app/(dashboard)/page.tsx — dashboard.
// Row 1: Realtime Event Feed + Overview Stats
// Row 2: New Agents horizontal strip
// Row 3: Rising Stars
// Row 4: Filters (multi-select)
// Row 5: Agents table (Name | Chain | Service | Score | Feedback | Owner | Created)

import { useCallback, useEffect, useMemo, useState } from "react";
import { Search } from "lucide-react";
import { api, LeaderboardAgent, LeaderboardQuery } from "@/shared/api/client";
import { useChain } from "@/providers/ChainProvider";
import { Badge } from "@/shared/ui/Badge";
import RealtimeEventFeed from "@/features/leaderboard/components/RealtimeEventFeed";
import OverviewStats from "@/features/leaderboard/components/OverviewStats";
import NewAgentsStrip from "@/features/leaderboard/components/NewAgentsStrip";
import RisingStars from "@/features/leaderboard/components/RisingStars";
import DashboardFilters, { DashboardFilterValue } from "@/features/leaderboard/components/DashboardFilters";
import AgentsTable from "@/features/leaderboard/components/AgentsTable";
import PageNavigation from "@/shared/ui/PageNavigation";

type SortKey = NonNullable<LeaderboardQuery["sort"]>;

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
    const [query, setQuery] = useState("");
    const [sort, setSort] = useState<SortKey>("score_desc");
    const [page, setPage] = useState(1);
    const [limit] = useState(10);

    const [agents, setAgents] = useState<LeaderboardAgent[]>([]);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(true);

    // effective chain scope — empty means "all chains" for stats & new-agents queries.
    const effectiveChainIds = filter.chainIds;

    const queryKey = useMemo(() => JSON.stringify({ filter, query, sort, page, limit }), [filter, query, sort, page, limit]);

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

    useEffect(() => {
        loadAgents(); /* eslint-disable-next-line react-hooks/exhaustive-deps */
    }, [queryKey]);

    // Reset page when filters/search/sort change.
    useEffect(() => {
        setPage(1);
    }, [filter, query, sort]);

    const totalPages = Math.max(1, Math.ceil(total / limit));
    const activeFilterCount =
        filter.chainIds.length +
        filter.services.length +
        filter.oasfSkills.length +
        filter.oasfDomains.length +
        filter.tags.length +
        (filter.x402 !== undefined ? 1 : 0);

    return (
        <div className="container max-w-[1400px] mx-auto px-4 md:px-8 py-8 fade-in">
            {/* Page header */}
            <header className="mb-8">
                <h1 className="text-3xl md:text-4xl font-bold font-heading mb-2 text-white">
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

            {/* Row 3: Rising Stars */}
            <div className="mb-6">
                <RisingStars chainIds={effectiveChainIds} />
            </div>

            {/* Row 5: Filters — stack above table card so MultiSelect dropdowns paint over the table */}
            <div className="relative z-20 mb-6">
                <DashboardFilters chains={chains} value={filter} onChange={setFilter} />
            </div>

            {/* Row 6: Agents table */}
            <div className="relative z-0 bg-card border border-border rounded-xl p-4 md:p-5">
                <div className="flex flex-wrap items-center justify-between gap-3 mb-4 pb-3 border-b border-white/5">
                    <div className="flex bg-black/40 border border-border rounded-md px-3 py-2 items-center flex-1 min-w-[240px] max-w-sm focus-within:border-primary transition-colors">
                        <Search size={14} className="text-muted shrink-0 mr-2" />
                        <input
                            className="bg-transparent border-none outline-none text-white w-full placeholder:text-muted/60 text-sm"
                            placeholder="Search name, agent ID, OASF skill or domain…"
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
                        <span className="text-sm text-muted font-medium">{loading ? "Loading…" : `${total.toLocaleString()} agents`}</span>
                        {activeFilterCount > 0 && <Badge variant="accent">Filtered</Badge>}
                    </div>
                </div>

                <div className="flex flex-col">
                    <div className="min-h-0">
                        <AgentsTable agents={agents} chains={chains} loading={loading} pageSize={limit} />
                    </div>

                    {/* Fixed slot so pagination never rides up when a page has fewer rows */}
                    {total > 0 && (
                        <PageNavigation
                            className="mt-6 border-t border-border pt-4"
                            page={page}
                            totalPages={totalPages}
                            loading={loading}
                            onPageChange={setPage}
                        />
                    )}
                </div>
            </div>
        </div>
    );
}
