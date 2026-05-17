'use client';
// features/leaderboard/components/NewAgentsStrip.tsx
// Horizontally-scrollable strip of 4-8 freshly registered agents across the
// currently selected chain scope. Clicks navigate to the agent profile.

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { Sparkles, ChevronLeft, ChevronRight } from 'lucide-react';
import { api, LeaderboardAgent, resolveIPFS } from '@/shared/api/client';
import { useChain } from '@/providers/ChainProvider';
import { FALLBACK_AVATAR_DATA_URI } from '@/shared/constants/app';
import { Skeleton } from '@/shared/ui/Skeleton';
import { Badge } from '@/shared/ui/Badge';
import { ChainBadge } from '@/shared/ui/ChainBadge';

interface Props {
    chainIds: number[];
    limit?: number;
}

function fallbackImg(e: React.SyntheticEvent<HTMLImageElement>) {
    (e.target as HTMLImageElement).src = FALLBACK_AVATAR_DATA_URI;
}

function relativeTime(createdAt?: number): string {
    if (!createdAt) return '';
    const diff = Date.now() - createdAt * 1000;
    if (diff < 0) return 'just now';
    const h = Math.floor(diff / 3_600_000);
    if (h < 1) return 'just now';
    if (h < 24) return `${h}h ago`;
    const d = Math.floor(h / 24);
    return `${d}d ago`;
}

export default function NewAgentsStrip({ chainIds, limit = 8 }: Props) {
    const { chains } = useChain();
    const chainMap = useMemo(() => new Map(chains.map((c) => [c.chainId, c])), [chains]);
    const [agents, setAgents] = useState<LeaderboardAgent[]>([]);
    const [loading, setLoading] = useState(true);
    const [scrollEl, setScrollEl] = useState<HTMLDivElement | null>(null);

    useEffect(() => {
        let cancelled = false;
        setLoading(true);
        api.newAgents(chainIds, limit).then((r) => {
            if (cancelled) return;
            if (r.success) setAgents(r.data ?? []);
            setLoading(false);
        });
        return () => { cancelled = true; };
    }, [chainIds.join(','), limit]); // eslint-disable-line react-hooks/exhaustive-deps

    function scrollBy(dx: number) { scrollEl?.scrollBy({ left: dx, behavior: 'smooth' }); }

    return (
        <section className="bg-card border border-border rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <Sparkles size={16} className="text-accent" />
                    <h2 className="text-base font-bold text-white">New Agents</h2>
                    <span className="text-xs text-muted">recently registered</span>
                </div>
                <div className="flex items-center gap-1">
                    <button aria-label="scroll left" onClick={() => scrollBy(-320)} className="p-1.5 rounded-md border border-border text-muted hover:text-white hover:bg-white/5 transition-colors">
                        <ChevronLeft size={14} />
                    </button>
                    <button aria-label="scroll right" onClick={() => scrollBy(320)} className="p-1.5 rounded-md border border-border text-muted hover:text-white hover:bg-white/5 transition-colors">
                        <ChevronRight size={14} />
                    </button>
                </div>
            </div>

            <div ref={setScrollEl} className="flex gap-3 overflow-x-auto pb-2 snap-x scrollbar-thin">
                {loading && Array.from({ length: 5 }).map((_, i) => (
                    <Skeleton key={i} className="h-[140px] w-[260px] rounded-xl flex-shrink-0" />
                ))}
                {!loading && agents.length === 0 && (
                    <div className="text-sm text-muted py-8 px-4">No agents registered yet.</div>
                )}
                {!loading && agents.map((a) => (
                    <Link
                        key={`${a.chainId}:${a.agentId}`}
                        href={`/agents/${a.chainId}/${a.agentId}`}
                        className="group flex-shrink-0 w-[260px] snap-start bg-black/30 border border-border rounded-xl p-4 hover:border-primary/60 hover:bg-white/5 transition-colors"
                    >
                        <div className="flex items-center gap-3 mb-3">
                            <img
                                src={resolveIPFS(a.image)}
                                alt={a.name}
                                className="w-12 h-12 rounded-full border border-border group-hover:border-primary transition-colors"
                                onError={fallbackImg}
                            />
                            <div className="flex flex-col min-w-0 flex-1 gap-1.5">
                                <span className="font-bold text-white truncate">{a.name || `Agent #${a.agentId}`}</span>
                                <ChainBadge chainId={a.chainId} chain={chainMap.get(a.chainId)} size="md" className="w-fit" />
                            </div>
                        </div>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1.5">
                                {a.hasOASF && <Badge variant="success" size="xs">OASF</Badge>}
                                {a.x402Support && <Badge variant="primary" size="xs">x402</Badge>}
                            </div>
                            <span className="text-xs text-subtle">{relativeTime(a.createdAt)}</span>
                        </div>
                    </Link>
                ))}
            </div>
        </section>
    );
}
