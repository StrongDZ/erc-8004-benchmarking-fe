'use client';
import { useState, useEffect } from 'react';
import { Copy, Check, ExternalLink, Info } from 'lucide-react';
import { explorerAddressUrl, formatScore, truncateAddress } from '@/shared/api/client';
import { useWalletENS } from '@/shared/hooks/useWalletENS';
import { WalletAvatar } from '@/shared/ui/WalletAvatar';
import { Badge } from '@/shared/ui/Badge';
import type { ExternalScoreFactor } from '@/shared/api/client';
import { getScoreColorClass, getScoreCssVar } from '@/shared/lib/compositeScore';

const ON_CHAIN_SCORE_TOOLTIP =
    'On-chain credit score (0–100) from general wallet activity on Ethereum. It contributes to the wallet Trust Score alongside community feedback. Each factor bar: width = its weight, fill = how strong this wallet scores on it.';

const ONCHAIN_FILL = 'linear-gradient(90deg,#F59E0B,#FBBF24)';

const FACTOR_LABELS: Record<string, string> = {
    age: 'Wallet age',
    counterparties: 'Counterparties',
    balance: 'Balance',
    activity: 'Activity',
    ens: 'ENS',
};

function formatUsdCompact(v: number): string {
    if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M`;
    if (v >= 1_000) return `$${(v / 1_000).toFixed(1)}k`;
    return `$${Math.round(v)}`;
}

/** Human-readable raw magnitude for one external factor. */
function factorValue(f: ExternalScoreFactor): string {
    switch (f.key) {
        case 'age':
            return f.raw >= 365 ? `${(f.raw / 365).toFixed(1)}y` : `${Math.round(f.raw)}d`;
        case 'counterparties':
            return Math.round(f.raw).toLocaleString();
        case 'balance':
            return formatUsdCompact(f.raw);
        case 'activity':
            return `${Math.round(f.raw).toLocaleString()} tx`;
        case 'ens':
            return f.raw > 0 ? '✓' : '—';
        default:
            return String(f.raw);
    }
}

function ScoreOutOf100({ value, size = 'lg' }: { value: number; size?: 'lg' | 'sm' }) {
    const scoreColor = getScoreColorClass(value);
    const valueClass = size === 'lg'
        ? `text-3xl font-heading font-bold ${scoreColor} tabular-nums`
        : `text-lg font-heading font-bold ${scoreColor} tabular-nums`;
    const slashClass = size === 'lg'
        ? 'text-lg font-light text-subtle/70 italic -skew-x-12 mx-0.5'
        : 'text-sm font-light text-subtle/70 italic -skew-x-12 mx-0.5';
    const maxClass = size === 'lg'
        ? 'text-sm font-medium text-subtle tabular-nums'
        : 'text-3xs font-medium text-subtle tabular-nums';
    return (
        <span className="inline-flex items-baseline leading-none">
            <span className={valueClass}>{formatScore(value)}</span>
            <span className={slashClass} aria-hidden>/</span>
            <span className={maxClass}>100</span>
        </span>
    );
}

interface Props {
    address: string;
    chainId?: number;
    ownedCount: number;
    ownedLoading: boolean;
    feedbackCount: number;
    interactedCount: number;
    trustScore?: number | null;
    externalScore?: number | null;
    externalComplete?: boolean;
    externalFactors?: ExternalScoreFactor[];
    kind?: 'user' | 'owner';
    feedbackValidCount?: number;
    feedbackJunkCount?: number;
}

export default function WalletHero({ address, chainId = 1, ownedCount, ownedLoading, feedbackCount, interactedCount, trustScore, externalScore, externalComplete, externalFactors, kind, feedbackValidCount, feedbackJunkCount }: Props) {
    const [copied, setCopied] = useState(false);
    const ens = useWalletENS(address);

    useEffect(() => {
        if (!copied) return;
        const timer = setTimeout(() => setCopied(false), 1200);
        return () => clearTimeout(timer);
    }, [copied]);

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(address);
            setCopied(true);
        } catch {
            setCopied(false);
        }
    };

    const validCount = feedbackValidCount ?? 0;
    const junkCount = feedbackJunkCount ?? 0;
    const credibilityTotal = validCount + junkCount;
    const validPct = credibilityTotal > 0 ? Math.round((validCount / credibilityTotal) * 100) : 0;

    const factors = externalFactors ?? [];
    const hasFactors = factors.length > 0;

    // Copy + explorer actions, rendered inline next to the truncated address.
    const addrActions = (
        <span className="flex items-center gap-1.5 shrink-0">
            <button
                type="button"
                onClick={handleCopy}
                className="shrink-0 text-subtle hover:text-white transition-colors"
                title={copied ? 'Copied!' : 'Copy address'}
            >
                {copied
                    ? <Check size={14} className="text-emerald-400" />
                    : <Copy size={14} />}
            </button>
            <a
                href={explorerAddressUrl(chainId, address)}
                target="_blank"
                rel="noopener noreferrer"
                className="shrink-0 inline-flex items-center rounded-md border border-border bg-white/5 p-1.5 text-subtle hover:text-primary hover:bg-white/10 transition-colors"
                title="View on block explorer"
            >
                <ExternalLink size={14} aria-hidden />
            </a>
        </span>
    );

    return (
        <div className="card p-6 md:p-8">
            <div className="flex flex-col md:flex-row gap-6 md:items-start">
                {/* Left: identity */}
                <div className="flex items-start gap-4 flex-1 min-w-0">
                    <WalletAvatar address={address} size={64} className="rounded-full border border-primary/30" />
                    <div className="flex-1 min-w-0">
                        <span className="flex items-center gap-2 mb-1.5">
                            <span className="text-xs uppercase tracking-wider text-subtle font-semibold">Wallet</span>
                            {kind && (
                                <Badge variant={kind === 'owner' ? 'primary' : 'muted'} size="xs">
                                    {kind === 'owner' ? 'Operator' : 'Reviewer'}
                                </Badge>
                            )}
                        </span>
                        {ens?.ens ? (
                            <>
                                <span
                                    className="block truncate mb-0.5 text-lg font-heading font-bold text-white"
                                    title={`${ens.ens} (${address})`}
                                >
                                    {ens.ens}
                                </span>
                                <div className="flex items-center gap-2 min-w-0 mb-1">
                                    <span className="font-mono text-sm text-muted truncate min-w-0" title={address}>
                                        {truncateAddress(address, 12)}
                                    </span>
                                    {addrActions}
                                </div>
                            </>
                        ) : (
                            <div className="flex items-center gap-2 min-w-0 mb-1">
                                <span
                                    className="text-lg font-heading font-bold text-white font-mono truncate min-w-0"
                                    title={address}
                                >
                                    {truncateAddress(address, 12)}
                                </span>
                                {addrActions}
                            </div>
                        )}
                        <p className="text-2xs text-subtle font-mono break-all">{address}</p>
                    </div>
                </div>

                {/* Right: trust score + on-chain input */}
                <div className="card-glass p-4 flex flex-col gap-3 min-w-[220px] shrink-0">
                    <div className="flex flex-col gap-1.5">
                        <span className="text-xs uppercase tracking-wider text-subtle">Trust Score</span>
                        {trustScore != null ? (
                            <>
                                <ScoreOutOf100 value={trustScore} size="lg" />
                                <div className="score-bar-wrap w-full mt-1.5" style={{ height: '5px' }}>
                                    <div
                                        className="h-full rounded-[2px] transition-all duration-700"
                                        style={{ 
                                            width: `${Math.min(100, trustScore)}%`,
                                            backgroundColor: getScoreCssVar(trustScore),
                                            boxShadow: `0 0 10px ${getScoreCssVar(trustScore)}66`
                                        }}
                                    />
                                </div>
                            </>
                        ) : (
                            <span className="text-sm uppercase tracking-wider text-subtle font-semibold leading-none">Unrated</span>
                        )}
                    </div>

                    {credibilityTotal > 0 && (
                        <div className="flex flex-col gap-1.5">
                            <span className="flex items-center justify-between gap-2">
                                <span className="text-3xs uppercase tracking-wider text-subtle">Reviewer credibility</span>
                                <span className="text-2xs font-semibold text-success tabular-nums">{validPct}%</span>
                            </span>
                            <div className="h-1.5 w-full overflow-hidden rounded-full bg-danger/30">
                                <div className="h-full rounded-full bg-success" style={{ width: `${validPct}%` }} />
                            </div>
                            <span className="text-3xs text-subtle tabular-nums">{validCount} valid · {junkCount} junk</span>
                        </div>
                    )}
                </div>
            </div>

            {/* On-chain credit — weighted factor breakdown (width = weight, fill = strength) */}
            {hasFactors ? (
                <div className="mt-6 pt-5 border-t border-white/5">
                    <div className="flex items-center justify-between gap-3 mb-3.5">
                        <span className="inline-flex items-center gap-1.5">
                            <span className="text-xs uppercase tracking-wider text-subtle font-semibold">On-chain Credit</span>
                            <span className="relative inline-flex group">
                                <button
                                    type="button"
                                    aria-label="About on-chain credit score"
                                    className="inline-flex text-subtle hover:text-white transition-colors cursor-help"
                                >
                                    <Info size={11} aria-hidden />
                                </button>
                                <span
                                    role="tooltip"
                                    className="pointer-events-none absolute left-0 top-full z-50 mt-1.5 w-[min(18rem,calc(100vw-2rem))] rounded-lg border border-white/10 bg-elevated px-2.5 py-2 text-left text-3xs font-normal normal-case tracking-normal text-white/90 opacity-0 shadow-xl transition-opacity group-hover:opacity-100 group-focus-within:opacity-100"
                                >
                                    {ON_CHAIN_SCORE_TOOLTIP}
                                </span>
                            </span>
                            {!externalComplete && <Badge variant="muted" size="xs">Partial</Badge>}
                        </span>
                        {externalScore != null && <ScoreOutOf100 value={externalScore} size="sm" />}
                    </div>

                    <div className="flex flex-col gap-2.5">
                        {factors.map(f => {
                            const fillPct = Math.max(0, Math.min(100, f.score));
                            return (
                                <div key={f.key} className="flex items-center gap-3">
                                    <span className="w-28 shrink-0 text-2xs text-muted truncate">{FACTOR_LABELS[f.key] ?? f.key}</span>
                                    <div className="flex-1 h-2">
                                        {f.present ? (
                                            <div className="h-full w-full rounded-full bg-white/5 overflow-hidden">
                                                <div
                                                    className="h-full rounded-full"
                                                    style={{ width: `${fillPct}%`, background: ONCHAIN_FILL }}
                                                />
                                            </div>
                                        ) : (
                                            <div className="h-full w-full rounded-full border border-dashed border-white/15" />
                                        )}
                                    </div>
                                    <span className="w-20 shrink-0 text-right text-2xs tabular-nums leading-none">
                                        <span className="text-3xs text-subtle">{Math.round(f.weight * 100)}%</span>
                                        {f.present
                                            ? <span className="ml-1.5 text-white font-semibold">{factorValue(f)}</span>
                                            : <span className="ml-1.5 italic text-subtle/70">···</span>}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                </div>
            ) : externalScore === null ? (
                <div className="mt-6 pt-5 border-t border-white/5">
                    <span className="text-xs uppercase tracking-wider text-subtle font-semibold">On-chain Credit</span>
                    <p className="text-2xs text-subtle mt-1">Pending on-chain enrichment.</p>
                </div>
            ) : null}

            {/* Stats bar */}
            <div className="grid grid-cols-3 gap-4 mt-6 pt-5 border-t border-white/5">
                <div className="flex flex-col gap-0.5">
                    {ownedLoading
                        ? <div className="skeleton h-7 w-12 rounded" />
                        : <span className="text-2xl font-bold text-white tabular-nums">{ownedCount}</span>
                    }
                    <span className="text-xs text-subtle">Agents Owned</span>
                </div>
                <div className="flex flex-col gap-0.5">
                    <span className="text-2xl font-bold text-white tabular-nums">{feedbackCount}</span>
                    <span className="text-xs text-subtle">Feedback Given</span>
                </div>
                <div className="flex flex-col gap-0.5">
                    <span className="text-2xl font-bold text-white tabular-nums">{interactedCount}</span>
                    <span className="text-xs text-subtle">Agents Interacted</span>
                </div>
            </div>
        </div>
    );
}
