"use client";
import { useEffect, useState, useMemo } from "react";
import { Search, Cpu, Server, MessageSquare } from "lucide-react";
import { api } from "@/shared/api/client";
import type { IndexerChainStatusView } from "@/shared/api/client";
import { useSocketEvent } from "@/shared/hooks/useSocketEvent";
import { type RealtimeEvent } from "@/shared/hooks/useRealtimeEvents";
import IndexerCard from "@/features/indexer/components/IndexerCard";
import { INDEXER_STATUS_POLL_INTERVAL_MS } from "@/shared/constants/app";
import { chainDisplayMeta } from "@/shared/api/utils/chains";

export default function IndexerPage() {
    const [statuses, setStatuses] = useState<IndexerChainStatusView[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    // Per-chainId live block from WebSocket
    const [liveBlocks, setLiveBlocks] = useState<Record<number, number>>({});

    async function fetchStatus() {
        try {
            const res = await api.indexerStatus();
            if (res.success && Array.isArray(res.data?.chains)) {
                const normalized = res.data.chains.map((s) => {
                    const meta = chainDisplayMeta(s.chainId);
                    return {
                        ...s,
                        chainName: meta.name,
                        iconUrl: meta.iconUrl,
                        brandColor: meta.brandColor,
                        agentCount: s.agentCount ?? 0,
                        feedbackCount: s.feedbackCount ?? 0,
                        lastIndexedAt: s.lastIndexedAt,
                    };
                });
                normalized.sort((a, b) => a.chainId - b.chainId);
                setStatuses(normalized);
            } else {
                setStatuses([]);
            }
        } catch {
            setStatuses([]);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        fetchStatus();
        const interval = setInterval(fetchStatus, INDEXER_STATUS_POLL_INTERVAL_MS);
        return () => clearInterval(interval);
    }, []);

    // Live block updates from decoded events
    useSocketEvent<RealtimeEvent>("event.decoded", (payload) => {
        if (!payload.chainId || !payload.blockNumber) return;
        setLiveBlocks((prev) => {
            const current = prev[payload.chainId] ?? 0;
            if (payload.blockNumber! > current) {
                return { ...prev, [payload.chainId]: payload.blockNumber! };
            }
            return prev;
        });
    });

    const safeStatuses = Array.isArray(statuses) ? statuses : [];

    const filtered = useMemo(() => {
        if (!search.trim()) return safeStatuses;
        const q = search.trim().toLowerCase();
        return safeStatuses.filter((s) => (s.chainName ?? "").toLowerCase().includes(q) || String(s.chainId).includes(q));
    }, [safeStatuses, search]);

    const totalAgents = safeStatuses.reduce((sum, s) => sum + (s.agentCount ?? 0), 0);
    const totalFeedbacks = safeStatuses.reduce((sum, s) => sum + (s.feedbackCount ?? 0), 0);

    return (
        <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">
            {/* Page header */}
            <div className="flex flex-col gap-1">
                <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-primary/10 border border-primary/20">
                        <Server size={18} className="text-primary" />
                    </div>
                    <h1 className="text-2xl font-bold font-heading text-white">Indexer</h1>
                </div>
                <p className="text-sm text-muted ml-[52px]">Real-time indexer progress across all chains</p>
            </div>

            {/* Summary KPIs */}
            <div className="grid grid-cols-3 gap-4">
                <div className="card flex items-center gap-4 px-5 py-4">
                    <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-primary/10 border border-primary/20">
                        <Cpu size={16} className="text-primary" />
                    </div>
                    <div>
                        <div className="text-2xl font-bold font-heading text-white">{safeStatuses.length}</div>
                        <div className="text-xs uppercase tracking-widest text-subtle">Chains</div>
                    </div>
                </div>
                <div className="card flex items-center gap-4 px-5 py-4">
                    <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-accent/10 border border-accent/20">
                        <Server size={16} className="text-accent" />
                    </div>
                    <div>
                        <div className="text-2xl font-bold font-heading text-white">
                            {totalAgents.toLocaleString()}
                            <span className="text-sm font-normal text-muted ml-1">agents</span>
                        </div>
                        <div className="text-xs uppercase tracking-widest text-subtle">{totalFeedbacks.toLocaleString()} feedbacks</div>
                    </div>
                </div>
                <div className="card flex items-center gap-4 px-5 py-4">
                    <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-success/10 border border-success/20">
                        <MessageSquare size={16} className="text-success" />
                    </div>
                    <div>
                        <div className="text-2xl font-bold font-heading text-white">
                            {totalFeedbacks.toLocaleString()}
                        </div>
                        <div className="text-xs uppercase tracking-widest text-subtle">Total feedbacks</div>
                    </div>
                </div>
            </div>

            {/* Search */}
            <div className="flex items-center bg-card rounded-xl px-4 py-2.5 border border-border focus-within:border-primary/50 transition-colors max-w-sm">
                <Search size={15} className="text-muted mr-2.5 shrink-0" />
                <input
                    className="bg-transparent border-none text-white outline-none text-sm w-full placeholder:text-subtle"
                    placeholder="Search by chain name or ID…"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
            </div>

            {/* Grid */}
            {loading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {Array.from({ length: 3 }).map((_, i) => (
                        <div key={i} className="card h-52 animate-pulse bg-white/[0.03]" />
                    ))}
                </div>
            ) : filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-center gap-3">
                    <Server size={32} className="text-subtle" />
                    <p className="text-muted">{search ? `No chains matching "${search}"` : "No indexer data available"}</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filtered.map((s) => (
                        <IndexerCard key={s.chainId} status={s} liveBlock={liveBlocks[s.chainId]} />
                    ))}
                </div>
            )}
        </div>
    );
}
