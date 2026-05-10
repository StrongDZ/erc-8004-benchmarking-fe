'use client';
import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { FileText, RotateCcw } from 'lucide-react';
import { api, Chain, WalletFeedback, explorerUrl, resolveIPFS } from '@/shared/api/client';
import { Badge } from '@/shared/ui/Badge';
import { ChainBadge } from '@/shared/ui/ChainBadge';
import PageNavigation from '@/shared/ui/PageNavigation';
import { Skeleton } from '@/shared/ui/Skeleton';

interface Props {
    address: string;
    chains?: Chain[];
    onTotalChange?: (total: number) => void;
}

const UNIT_BY_TAG: Record<string, string> = {
    responseTime: 'ms',
    processingTime: 's',
    blockDelay: 'blocks',
    uptime: '%',
    successRate: '%',
    confidence: '%',
    tps: 'tok/s',
    reachable: 'bool',
    ownerVerified: 'bool',
    kycCleared: 'bool',
};

function resolveUnit(fb: WalletFeedback): string {
    if (fb.unit && fb.unit !== 'none') return fb.unit;
    if (fb.tag1 && UNIT_BY_TAG[fb.tag1]) return UNIT_BY_TAG[fb.tag1];
    return '';
}

function formatValue(fb: WalletFeedback): string {
    const rawNum = parseInt(fb.value ?? '0', 10);
    if (isNaN(rawNum)) return fb.value ?? '—';
    const decimals = fb.valueDecimals ?? 0;
    const real = rawNum / Math.pow(10, decimals);
    const unit = resolveUnit(fb);
    if (unit === 'bool') return rawNum === 1 ? 'True' : 'False';
    if (unit === '%') return `${real.toFixed(decimals > 0 ? Math.min(decimals, 2) : 0)}%`;
    if (unit === 'tok/s') return `${real.toFixed(1)} tok/s`;
    if (unit === 'ms') return `${real.toFixed(0)} ms`;
    if (unit === 's') return `${real.toFixed(1)} s`;
    if (unit === 'blocks') return `${real.toFixed(0)} blk`;
    const formatted = decimals > 0 ? real.toFixed(Math.min(decimals, 4)) : String(real);
    return unit ? `${formatted} ${unit}` : formatted;
}

function scoreColor(vi: number, revoked: boolean): string {
    if (revoked) return 'bg-white/10 text-subtle border-white/15';
    if (vi >= 0.8) return 'bg-emerald-500/15 text-emerald-400 border-emerald-500/25';
    if (vi >= 0.5) return 'bg-amber-500/15 text-amber-400 border-amber-500/25';
    return 'bg-red-500/15 text-red-400 border-red-500/25';
}

/** Overrides global `.badge` pill — rectangular, larger type */
const fbTagClass =
    '!rounded-lg !py-2 !px-3.5 !text-xs sm:!text-[0.8125rem] !font-semibold !tracking-wide !leading-none';

const PAGE_SIZE = 10;

export default function FeedbackGivenSection({ address, chains = [], onTotalChange }: Props) {
    const [data, setData] = useState<WalletFeedback[]>([]);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [loading, setLoading] = useState(true);

    const chainMap = useMemo(() => new Map(chains.map((c) => [c.chainId, c])), [chains]);

    useEffect(() => {
        setPage(1);
    }, [address]);

    useEffect(() => {
        setLoading(true);
        api.feedbackGiven(address, page, PAGE_SIZE)
            .then(r => {
                if (r.success) {
                    const items = r.data ?? [];
                    const t = r.meta?.total ?? items.length;
                    setData(items);
                    setTotal(t);
                    onTotalChange?.(t);
                } else {
                    setData([]);
                    setTotal(0);
                    onTotalChange?.(0);
                }
            })
            .catch(() => {
                setData([]);
                setTotal(0);
                onTotalChange?.(0);
            })
            .finally(() => setLoading(false));
    }, [address, page]);

    const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

    return (
        <div className="card p-5">
            <h2 className="font-heading text-lg text-white flex items-center gap-2 mb-4">
                Feedback Given
                {!loading && (
                    <span className="text-sm font-normal text-muted bg-white/5 px-2 py-0.5 rounded-md">
                        {total}
                    </span>
                )}
            </h2>

            {loading ? (
                <div className="flex flex-col gap-3">
                    {Array.from({ length: 5 }).map((_, i) => (
                        <Skeleton key={i} className="h-36 w-full rounded-xl" />
                    ))}
                </div>
            ) : data.length === 0 ? (
                <p className="text-sm text-muted py-8 text-center">
                    No feedback records found for this wallet address.
                </p>
            ) : (
                <>
                    <div className="flex flex-col gap-3">
                        {data.map(fb => {
                            const isRevoked = !!fb.revokeTxHash;
                            const metricLabel = fb.tag1 || resolveUnit(fb) || 'Value';
                            return (
                                <div
                                    key={fb._id}
                                    className={`rounded-xl border border-white/10 bg-black/25 p-4 sm:p-5 ${
                                        isRevoked ? 'opacity-60' : ''
                                    }`}
                                >
                                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between lg:gap-6">
                                        <div className="flex gap-3 min-w-0 flex-1">
                                            <span className="text-sm font-mono text-subtle shrink-0 tabular-nums pt-0.5">
                                                #{fb.feedbackIndex}
                                            </span>
                                            <div className="min-w-0 flex-1 space-y-3">
                                                <div className="flex flex-wrap items-center gap-2 min-w-0">
                                                    <ChainBadge
                                                        chainId={fb.chainId}
                                                        chain={chainMap.get(fb.chainId)}
                                                        size="sm"
                                                        className="max-w-[min(100%,11rem)] shrink-0"
                                                    />
                                                    <Link
                                                        href={`/agents/${fb.chainId}/${fb.agentId}`}
                                                        className="min-w-0 text-base font-semibold text-primary hover:underline decoration-primary/40 underline-offset-2 break-words"
                                                    >
                                                        {fb.agentName ?? `Agent #${fb.agentId}`}
                                                    </Link>
                                                </div>

                                                <div className="flex flex-wrap items-center gap-2">
                                                    <Badge variant="muted" className={fbTagClass}>
                                                        {fb.classification?.category ?? 'unknown'}
                                                    </Badge>
                                                    {isRevoked && (
                                                        <Badge variant="danger" className={fbTagClass}>
                                                            Revoked
                                                        </Badge>
                                                    )}
                                                    {!isRevoked && fb.vi >= 0.5 && (
                                                        <Badge variant="success" className={fbTagClass}>
                                                            Passed
                                                        </Badge>
                                                    )}
                                                    {!isRevoked && fb.vi < 0.5 && (
                                                        <Badge variant="danger" className={fbTagClass}>
                                                            Failed
                                                        </Badge>
                                                    )}
                                                </div>

                                                <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-subtle">
                                                    <span>{new Date(fb.timestamp).toLocaleDateString()}</span>

                                                    {fb.txHash && (
                                                        <>
                                                            <span className="text-muted/80">·</span>
                                                            <a
                                                                href={explorerUrl(fb.chainId, fb.txHash)}
                                                                target="_blank"
                                                                rel="noreferrer"
                                                                className="font-mono text-[13px] text-muted hover:text-primary transition-colors"
                                                                title="View transaction"
                                                            >
                                                                {fb.txHash.slice(0, 6)}…{fb.txHash.slice(-4)}
                                                            </a>
                                                        </>
                                                    )}

                                                    {fb.endpoint && (
                                                        <>
                                                            <span className="text-muted/80">·</span>
                                                            <span
                                                                className="inline-flex items-center rounded-lg px-2.5 py-1 text-[12px] font-mono bg-primary/10 text-primary/80 border border-primary/25 max-w-full sm:max-w-[min(100%,280px)] truncate"
                                                                title={fb.endpoint}
                                                            >
                                                                {fb.endpoint.replace(/^https?:\/\//, '')}
                                                            </span>
                                                        </>
                                                    )}

                                                    {fb.feedbackURI && (
                                                        <>
                                                            <span className="text-muted/80">·</span>
                                                            <a
                                                                href={resolveIPFS(fb.feedbackURI)}
                                                                target="_blank"
                                                                rel="noreferrer"
                                                                className="inline-flex text-muted hover:text-accent transition-colors p-0.5"
                                                                title="View IPFS content"
                                                            >
                                                                <FileText size={16} />
                                                            </a>
                                                        </>
                                                    )}

                                                    {fb.revokeTxHash && (
                                                        <>
                                                            <span className="text-muted/80">·</span>
                                                            <a
                                                                href={explorerUrl(fb.chainId, fb.revokeTxHash)}
                                                                target="_blank"
                                                                rel="noreferrer"
                                                                className="inline-flex text-muted hover:text-danger transition-colors p-0.5"
                                                                title="Revoke transaction"
                                                            >
                                                                <RotateCcw size={16} />
                                                            </a>
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        <div
                                            className={`flex shrink-0 flex-col justify-center rounded-xl border px-4 py-3 text-center min-h-[4.25rem] min-w-0 w-full sm:min-w-[9rem] sm:max-w-md sm:self-stretch lg:w-auto lg:max-w-[11rem] ${scoreColor(
                                                fb.vi,
                                                isRevoked
                                            )}`}
                                        >
                                            <span className="text-[10px] font-semibold uppercase tracking-wide opacity-75 mb-1 line-clamp-2 leading-snug">
                                                {metricLabel}
                                            </span>
                                            <span className="text-lg sm:text-xl font-bold tabular-nums leading-tight break-all">
                                                {formatValue(fb)}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
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
                </>
            )}
        </div>
    );
}
