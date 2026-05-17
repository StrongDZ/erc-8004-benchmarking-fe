'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, TrendingUp } from 'lucide-react';
import { api, RisingStar, resolveIPFS } from '@/shared/api/client';
import { useChain } from '@/providers/ChainProvider';
import { FALLBACK_AVATAR_DATA_URI } from '@/shared/constants/app';
import { ChainBadge } from '@/shared/ui/ChainBadge';
import PageNavigation from '@/shared/ui/PageNavigation';
import { Skeleton } from '@/shared/ui/Skeleton';

const PERIODS = ['24h', '7d', '30d'] as const;
const API_MAX = 50;
const PAGE_SIZE = 15;

function fallbackImg(e: React.SyntheticEvent<HTMLImageElement>) {
    (e.target as HTMLImageElement).src = FALLBACK_AVATAR_DATA_URI;
}

function parseChainIds(raw: string | null, fallback: number[]): number[] {
    if (!raw?.trim()) return fallback;
    return raw
        .split(',')
        .map((s) => parseInt(s.trim(), 10))
        .filter((n) => !Number.isNaN(n) && n > 0);
}

export default function RisingStarsTablePage() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const pathname = usePathname();
    const { chains } = useChain();
    const chainMap = useMemo(() => new Map(chains.map((c) => [c.chainId, c])), [chains]);

    const defaultChainIds = useMemo(() => chains.map((c) => c.chainId), [chains]);

    const [period, setPeriod] = useState('24h');
    const [scopeIds, setScopeIds] = useState<number[]>([]);
    const [rows, setRows] = useState<RisingStar[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);

    useEffect(() => {
        const p = searchParams.get('period')?.trim() || '24h';
        setPeriod(PERIODS.includes(p as (typeof PERIODS)[number]) ? p : '24h');
        setScopeIds(parseChainIds(searchParams.get('chainId'), defaultChainIds));
    }, [searchParams, defaultChainIds]);

    const load = useCallback(async () => {
        if (scopeIds.length === 0) {
            setRows([]);
            setLoading(false);
            return;
        }
        setLoading(true);
        const r = await api.risingStarsMulti(scopeIds, period, API_MAX);
        if (r.success) setRows(r.data ?? []);
        else setRows([]);
        setLoading(false);
    }, [scopeIds, period]);

    useEffect(() => {
        load();
    }, [load]);

    useEffect(() => {
        setPage(1);
    }, [period, scopeIds.join(',')]);

    const setPeriodAndUrl = useCallback(
        (p: string) => {
            setPeriod(p);
            const q = new URLSearchParams();
            if (scopeIds.length) q.set('chainId', scopeIds.join(','));
            q.set('period', p);
            router.replace(`${pathname}?${q.toString()}`);
        },
        [pathname, router, scopeIds],
    );

    const totalPages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
    const slice = useMemo(() => {
        const start = (page - 1) * PAGE_SIZE;
        return rows.slice(start, start + PAGE_SIZE);
    }, [rows, page]);

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
                <h1 className="font-heading text-3xl font-bold text-white md:text-4xl">Rising Stars</h1>
                <p className="mt-2 max-w-2xl text-sm text-muted">
                    Agents with the strongest trust score increase over the selected window. Rankings merge multiple
                    chains when several are selected.
                </p>
            </div>

            <div className="mb-6 flex flex-wrap items-center justify-between gap-4 rounded-xl border border-border bg-card p-4">
                <div className="flex flex-wrap gap-1 rounded-md border border-border bg-black/30 p-1">
                    {PERIODS.map((p) => (
                        <button
                            key={p}
                            type="button"
                            className={`rounded px-3 py-1.5 text-xs font-medium transition-colors ${
                                period === p ? 'bg-primary font-semibold text-black' : 'text-muted hover:text-white'
                            }`}
                            onClick={() => setPeriodAndUrl(p)}
                        >
                            {p}
                        </button>
                    ))}
                </div>
                <span className="text-sm text-muted">
                    {loading ? 'Loading…' : `${rows.length.toLocaleString()} agents (max ${API_MAX})`}
                </span>
            </div>

            <div className="overflow-hidden rounded-xl border border-border bg-black/20">
                <div className="w-full overflow-x-auto">
                    <table className="data-table w-full min-w-[720px] table-fixed text-left text-sm">
                        <thead className="sticky top-0 bg-black/50 text-xs font-semibold uppercase tracking-wider text-muted">
                            <tr>
                                <th className="w-[8%] border-b border-white/5 px-4 py-3">#</th>
                                <th className="w-[32%] border-b border-white/5 px-4 py-3">Agent</th>
                                <th className="w-[14%] border-b border-white/5 px-4 py-3">Chain</th>
                                <th className="w-[14%] border-b border-white/5 px-4 py-3 text-right">Score</th>
                                <th className="w-[14%] border-b border-white/5 px-4 py-3 text-right">Δ score</th>
                                <th className="w-[18%] border-b border-white/5 px-4 py-3 text-right">Velocity / day</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {loading &&
                                Array.from({ length: PAGE_SIZE }).map((_, i) => (
                                    <tr key={i}>
                                        <td colSpan={6} className="px-4 py-3">
                                            <Skeleton className="h-10 w-full rounded-md" />
                                        </td>
                                    </tr>
                                ))}
                            {!loading && scopeIds.length === 0 && (
                                <tr>
                                    <td colSpan={6} className="px-4 py-12 text-center text-muted">
                                        No chains configured yet. Open the dashboard once chains load, or add{' '}
                                        <code className="text-primary">?chainId=…</code> to the URL.
                                    </td>
                                </tr>
                            )}
                            {!loading && scopeIds.length > 0 && rows.length === 0 && (
                                <tr>
                                    <td colSpan={6} className="px-4 py-12 text-center text-muted">
                                        No rising stars for this period.
                                    </td>
                                </tr>
                            )}
                            {!loading &&
                                slice.map((star, i) => (
                                    <tr key={`${star.chainId}:${star.agentId}`} className="hover:bg-white/[0.03]">
                                        <td className="px-4 py-3 font-mono text-xs text-muted tabular-nums">
                                            {globalRank(i)}
                                        </td>
                                        <td className="px-4 py-3">
                                            <Link
                                                href={`/agents/${star.chainId}/${star.agentId}`}
                                                className="group flex min-w-0 items-center gap-3"
                                            >
                                                <img
                                                    src={resolveIPFS(star.image)}
                                                    alt={star.name || 'Agent'}
                                                    className="h-10 w-10 shrink-0 rounded-full border border-border object-cover group-hover:border-primary/60"
                                                    onError={fallbackImg}
                                                />
                                                <span className="truncate font-medium text-white group-hover:text-primary">
                                                    {star.name || star.agentId}
                                                </span>
                                            </Link>
                                        </td>
                                        <td className="px-4 py-3">
                                            <ChainBadge
                                                chainId={star.chainId}
                                                chain={chainMap.get(star.chainId)}
                                                size="sm"
                                                className="w-fit"
                                            />
                                        </td>
                                        <td className="px-4 py-3 text-right font-semibold tabular-nums text-white">
                                            {star.scoreNow.toFixed(2)}
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            <span className="inline-flex items-center justify-end gap-1 font-semibold tabular-nums text-success">
                                                <TrendingUp size={14} className="shrink-0 opacity-80" />+
                                                {star.delta.toFixed(2)}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-right tabular-nums text-muted">
                                            +{star.velocity.toFixed(3)}
                                        </td>
                                    </tr>
                                ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {rows.length > PAGE_SIZE && (
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
