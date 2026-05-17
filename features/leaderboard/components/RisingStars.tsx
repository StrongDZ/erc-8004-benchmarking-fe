'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, Rocket, TrendingUp, Zap } from 'lucide-react';
import { api, RisingStar, resolveIPFS } from '@/shared/api/client';
import { useChain } from '@/providers/ChainProvider';
import { FALLBACK_AVATAR_DATA_URI } from '@/shared/constants/app';
import { Badge } from '@/shared/ui/Badge';
import { ChainBadge } from '@/shared/ui/ChainBadge';
import { Skeleton } from '@/shared/ui/Skeleton';

interface Props {
    chainIds: number[];
}

const PERIODS = ['24h', '7d', '30d'] as const;
const STRIP_FETCH = 10;

function fallbackImg(e: React.SyntheticEvent<HTMLImageElement>) {
    (e.target as HTMLImageElement).src = FALLBACK_AVATAR_DATA_URI;
}

export default function RisingStars({ chainIds }: Props) {
    const { chains } = useChain();
    const chainMap = useMemo(() => new Map(chains.map((c) => [c.chainId, c])), [chains]);

    const scopeChainIds = useMemo(
        () => (chainIds.length > 0 ? chainIds : chains.map((c) => c.chainId)),
        [chainIds, chains],
    );

    const [data, setData] = useState<RisingStar[]>([]);
    const [period, setPeriod] = useState<string>('24h');
    const [loading, setLoading] = useState(true);
    const [scrollEl, setScrollEl] = useState<HTMLDivElement | null>(null);

    useEffect(() => {
        let cancelled = false;
        if (scopeChainIds.length === 0) {
            setData([]);
            setLoading(false);
            return;
        }
        setLoading(true);
        api.risingStarsMulti(scopeChainIds, period, STRIP_FETCH).then((r) => {
            if (cancelled) return;
            if (r.success) setData(r.data ?? []);
            setLoading(false);
        });
        return () => {
            cancelled = true;
        };
    }, [scopeChainIds.join(','), period]); // eslint-disable-line react-hooks/exhaustive-deps

    const viewAllHref = useMemo(() => {
        if (scopeChainIds.length === 0) return '/leaderboard/rising-stars';
        const p = new URLSearchParams();
        p.set('chainId', scopeChainIds.join(','));
        p.set('period', period);
        return `/leaderboard/rising-stars?${p.toString()}`;
    }, [scopeChainIds, period]);

    function scrollBy(dx: number) {
        scrollEl?.scrollBy({ left: dx, behavior: 'smooth' });
    }

    return (
        <section className="relative overflow-hidden rounded-xl border border-border bg-card p-5 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.04)]">
            <div
                className="pointer-events-none absolute -right-16 -top-24 h-48 w-48 rounded-full bg-primary/10 blur-3xl"
                aria-hidden
            />
            <div className="relative">
                <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                    <div className="flex flex-wrap items-center gap-2">
                        <Rocket size={16} className="text-primary" />
                        <h2 className="text-base font-bold text-white">Rising Stars</h2>
                        <span className="text-xs text-muted">largest score lift in period</span>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                        <div className="flex gap-1 rounded-md border border-border bg-black/30 p-1">
                            {PERIODS.map((p) => (
                                <button
                                    key={p}
                                    type="button"
                                    className={`rounded px-2.5 py-1 text-xs font-medium transition-colors ${
                                        period === p
                                            ? 'bg-primary font-semibold text-black'
                                            : 'text-muted hover:text-white'
                                    }`}
                                    onClick={() => setPeriod(p)}
                                >
                                    {p}
                                </button>
                            ))}
                        </div>
                        <div className="flex items-center gap-1">
                            <button
                                type="button"
                                aria-label="Scroll left"
                                onClick={() => scrollBy(-320)}
                                className="rounded-md border border-border p-1.5 text-muted transition-colors hover:bg-white/5 hover:text-white"
                            >
                                <ChevronLeft size={14} />
                            </button>
                            <button
                                type="button"
                                aria-label="Scroll right"
                                onClick={() => scrollBy(320)}
                                className="rounded-md border border-border p-1.5 text-muted transition-colors hover:bg-white/5 hover:text-white"
                            >
                                <ChevronRight size={14} />
                            </button>
                        </div>
                        <Link
                            href={viewAllHref}
                            className={`inline-flex items-center rounded-md border border-primary/40 bg-primary/10 px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-primary transition-colors hover:border-primary hover:bg-primary/20 ${
                                scopeChainIds.length === 0 ? 'pointer-events-none opacity-40' : ''
                            }`}
                        >
                            View all
                        </Link>
                    </div>
                </div>

                <div
                    ref={setScrollEl}
                    className="flex snap-x gap-3 overflow-x-auto pb-2 scrollbar-thin [scrollbar-color:rgba(255,255,255,0.15)_transparent]"
                >
                    {loading &&
                        Array.from({ length: 5 }).map((_, i) => (
                            <Skeleton key={i} className="h-[148px] w-[260px] flex-shrink-0 rounded-xl" />
                        ))}
                    {!loading && data.length === 0 && (
                        <div className="py-10 pl-1 text-sm text-muted">No rising stars for this scope and period.</div>
                    )}
                    {!loading &&
                        data.map((star, idx) => (
                            <Link
                                key={`${star.chainId}:${star.agentId}`}
                                href={`/agents/${star.chainId}/${star.agentId}`}
                                className="group relative flex w-[260px] flex-shrink-0 snap-start overflow-hidden rounded-xl border border-border bg-gradient-to-br from-black/50 to-black/20 p-4 transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/55 hover:shadow-[0_16px_48px_-20px_rgba(234,179,8,0.25)]"
                            >
                                <div
                                    className="absolute inset-y-2 left-0 w-0.5 rounded-full bg-gradient-to-b from-primary via-amber-300/90 to-primary/40 opacity-90"
                                    aria-hidden
                                />
                                <div className="relative flex w-full flex-col pl-2">
                                    <div className="mb-3 flex items-start justify-between gap-2">
                                        <span
                                            className={`inline-flex h-6 min-w-[1.5rem] items-center justify-center rounded-md px-1.5 text-[11px] font-bold ${
                                                idx === 0
                                                    ? 'bg-primary text-black'
                                                    : idx === 1
                                                      ? 'bg-zinc-300 text-black'
                                                      : idx === 2
                                                        ? 'bg-amber-400/90 text-black'
                                                        : 'bg-white/10 text-muted'
                                            }`}
                                        >
                                            #{idx + 1}
                                        </span>
                                        {idx === 0 && (
                                            <Badge variant="success" size="xs" className="shrink-0 gap-0.5">
                                                <Zap size={9} /> Top
                                            </Badge>
                                        )}
                                    </div>
                                    <div className="mb-3 flex items-center gap-3">
                                        <img
                                            src={resolveIPFS(star.image)}
                                            alt={star.name || 'Agent'}
                                            className="h-12 w-12 rounded-full border border-border object-cover transition-colors group-hover:border-primary/70"
                                            onError={fallbackImg}
                                        />
                                        <div className="min-w-0 flex-1">
                                            <div className="truncate font-bold text-white group-hover:text-primary">
                                                {star.name || `Agent ${star.agentId.slice(0, 8)}…`}
                                            </div>
                                            <ChainBadge
                                                chainId={star.chainId}
                                                chain={chainMap.get(star.chainId)}
                                                size="md"
                                                className="mt-1 w-fit"
                                            />
                                        </div>
                                    </div>
                                    <div className="mt-auto flex items-end justify-between gap-2 border-t border-white/5 pt-3">
                                        <div className="text-[11px] text-muted">
                                            Score{' '}
                                            <span className="font-semibold tabular-nums text-white">
                                                {star.scoreNow.toFixed(1)}
                                            </span>
                                            <span className="text-[10px] text-subtle ml-0.5">/100</span>
                                        </div>
                                        <div className="flex items-center gap-1 text-xs font-semibold text-success">
                                            <TrendingUp size={14} className="shrink-0" />
                                            <span className="tabular-nums">+{star.delta.toFixed(1)}</span>
                                        </div>
                                    </div>
                                </div>
                            </Link>
                        ))}
                </div>
            </div>
        </section>
    );
}
