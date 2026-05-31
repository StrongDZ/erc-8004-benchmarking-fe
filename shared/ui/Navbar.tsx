"use client";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useState, useRef, useEffect, useCallback } from "react";
import { Search, Activity, Shield, BarChart3, Zap } from "lucide-react";
import { useChain } from "@/providers/ChainProvider";
import { useSocket } from "@/providers/SocketProvider";
import { api } from "@/shared/api/client";
import { AgentAvatar } from "@/shared/ui/AgentAvatar";

interface SearchResult {
    chainId: number;
    agentId: string;
    name: string;
    image: string;
    trustScore: number;
}

export default function Navbar() {
    const { chainId } = useChain();
    const { state: socketState } = useSocket();
    const [query, setQuery] = useState("");
    const [results, setResults] = useState<SearchResult[]>([]);
    const [showSearch, setShowSearch] = useState(false);
    const [searching, setSearching] = useState(false);
    const searchRef = useRef<HTMLDivElement>(null);
    const timer = useRef<ReturnType<typeof setTimeout>>();
    const router = useRouter();

    const doSearch = useCallback(
        async (q: string) => {
            if (q.length < 2) {
                setResults([]);
                return;
            }
            setSearching(true);
            const r = await api.leaderboardSearch(chainId, q);
            if (r.success) setResults(r.data ?? []);
            setSearching(false);
        },
        [chainId],
    );

    useEffect(() => {
        clearTimeout(timer.current);
        timer.current = setTimeout(() => doSearch(query), 250);
        return () => clearTimeout(timer.current);
    }, [query, doSearch]);

    useEffect(() => {
        function handler(e: MouseEvent) {
            if (searchRef.current && !searchRef.current.contains(e.target as Node)) setShowSearch(false);
        }
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, []);

    const statusDot =
        socketState === "open"
            ? "bg-success"
            : socketState === "connecting" || socketState === "reconnecting"
              ? "bg-accent"
              : "bg-muted";
    const statusLabel =
        socketState === "open" ? "Live" : socketState === "connecting" ? "Connecting" : socketState === "reconnecting" ? "Reconnecting" : "Offline";

    return (
        <nav className="sticky top-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border text-sm px-6 h-16 w-full flex items-center justify-between shadow-2xl">
            <div className="flex items-center gap-6">
                {/* Brand */}
                <Link href="/" className="flex items-center gap-2 text-primary font-bold text-lg">
                    <div className="p-1 rounded bg-primary/20">
                        <Zap size={16} strokeWidth={2.5} />
                    </div>
                    <span className="text-white">
                        ERC<span className="text-primary">-8004</span>
                    </span>
                </Link>

                {/* Nav links */}
                <div className="flex items-center gap-4 border-l border-border pl-6 ml-2">
                    <Link href="/" className="flex items-center gap-2 text-muted hover:text-white transition-colors">
                        <BarChart3 size={15} /> Leaderboard
                    </Link>
                    <Link href="/penalties" className="flex items-center gap-2 text-muted hover:text-white transition-colors">
                        <Shield size={15} /> Penalty Log
                    </Link>
                    <Link href="/indexer" className="flex items-center gap-2 text-muted hover:text-white transition-colors">
                        <Activity size={15} /> Indexer
                    </Link>
                </div>
            </div>

            <div className="flex items-center gap-4">
                {/* Search */}
                <div ref={searchRef} className="relative">
                    <div className="flex items-center bg-card rounded-md px-3 py-1.5 border border-border focus-within:border-primary transition-colors">
                        <Search size={15} className="text-muted mr-2" />
                        <input
                            className="bg-transparent border-none text-white outline-none w-48 focus:w-64 transition-all text-sm"
                            placeholder="Search agents…"
                            aria-label="Search agents"
                            value={query}
                            onChange={(e) => {
                                setQuery(e.target.value);
                                setShowSearch(true);
                            }}
                            onFocus={() => setShowSearch(true)}
                        />
                    </div>
                    {showSearch && (results.length > 0 || searching) && (
                        <div
                            className="absolute top-full mt-2 w-[300px] right-0 bg-card border border-border rounded-xl shadow-2xl overflow-hidden py-2"
                            style={{ zIndex: 100 }}
                        >
                            {searching && <div className="px-4 py-3 text-muted text-sm border-b border-border">Searching…</div>}
                            {results.map((r) => (
                                <button
                                    key={r.agentId}
                                    className="w-full text-left flex items-center gap-3 px-4 py-2 hover:bg-white/5 transition-colors"
                                    onClick={() => {
                                        router.push(`/agents/${r.chainId}/${r.agentId}`);
                                        setShowSearch(false);
                                        setQuery("");
                                    }}
                                >
                                    <AgentAvatar
                                        image={r.image}
                                        seed={r.agentId}
                                        size={32}
                                        alt={r.name}
                                        className="w-8 h-8 rounded-full border border-border object-cover"
                                    />
                                    <div className="flex flex-col flex-1 overflow-hidden">
                                        <span className="text-white text-sm font-medium truncate">{r.name}</span>
                                        <span className="text-primary text-xs font-bold leading-none mt-1">
                                            Trust Score: {r.trustScore.toFixed(1)}/100
                                        </span>
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Realtime status (replaces chain dropdown — chain now lives in the dashboard filter). */}
                <div
                    className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-card border border-border"
                    title={`Realtime stream: ${statusLabel}`}
                >
                    <span className={`w-2 h-2 rounded-full ${statusDot} ${socketState === "open" ? "animate-pulse" : ""}`} />
                    <span className="text-xs font-medium text-muted">{statusLabel}</span>
                </div>
            </div>
        </nav>
    );
}
