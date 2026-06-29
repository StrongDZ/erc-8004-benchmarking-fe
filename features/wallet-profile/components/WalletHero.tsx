'use client';
import { useState, useEffect } from 'react';
import { Copy, Check, ExternalLink, Info } from 'lucide-react';
import { explorerAddressUrl, formatScore, truncateAddress } from '@/shared/api/client';
import { LinkOutbound } from '@/shared/ui/LinkOutbound';
import { useWalletENS } from '@/shared/hooks/useWalletENS';
import { WalletAvatar } from '@/shared/ui/WalletAvatar';
import { Badge } from '@/shared/ui/Badge';

const ON_CHAIN_SCORE_TOOLTIP =
    'On-chain credit score (0–100) from general wallet activity on Ethereum. It contributes to the wallet Trust Score alongside community feedback.';

function ScoreOutOf100({ value, size = 'lg' }: { value: number; size?: 'lg' | 'sm' }) {
    const valueClass = size === 'lg'
        ? 'text-3xl font-heading font-bold text-primary tabular-nums'
        : 'text-lg font-heading font-bold text-white tabular-nums';
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
    kind?: 'user' | 'owner';
    feedbackValidCount?: number;
    feedbackJunkCount?: number;
}

export default function WalletHero({ address, chainId = 1, ownedCount, ownedLoading, feedbackCount, interactedCount, trustScore, externalScore, kind, feedbackValidCount, feedbackJunkCount }: Props) {
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
                        <span
                            className={`block truncate mb-0.5 ${ens?.ens ? 'text-lg font-heading font-bold text-white' : 'text-lg font-heading font-bold text-white font-mono'}`}
                            title={ens?.ens ? `${ens.ens} (${address})` : address}
                        >
                            {ens?.ens || truncateAddress(address, 12)}
                        </span>
                        <div className="flex items-center gap-2 flex-wrap mb-1 min-w-0">
                            {ens?.ens && (
                                <span className="font-mono text-sm text-muted truncate min-w-0" title={address}>
                                    {truncateAddress(address, 12)}
                                </span>
                            )}
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
                            <LinkOutbound
                                href={explorerAddressUrl(chainId, address)}
                                external
                                className="shrink-0 inline-flex items-center rounded-md border border-border bg-white/5 p-1.5 text-subtle hover:text-primary hover:bg-white/10"
                                title="View on block explorer"
                            >
                                <ExternalLink size={14} aria-hidden />
                            </LinkOutbound>
                        </div>
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
                                <div className="score-bar-wrap w-full">
                                    <div
                                        className="score-bar-fill gold"
                                        style={{ width: `${Math.min(100, trustScore)}%` }}
                                    />
                                </div>
                            </>
                        ) : (
                            <span className="text-sm uppercase tracking-wider text-subtle font-semibold leading-none">Unrated</span>
                        )}
                    </div>

                    <div className="flex flex-col gap-1.5 pl-3 border-l-2 border-primary/30">
                        <span className="inline-flex items-center gap-1">
                            <span className="text-3xs uppercase tracking-wider text-subtle">On-chain credit score</span>
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
                                    className="pointer-events-none absolute right-0 bottom-full z-50 mb-1.5 w-[min(14rem,calc(100vw-2rem))] rounded-lg border border-white/10 bg-elevated px-2.5 py-2 text-left text-3xs font-normal normal-case tracking-normal text-white/90 opacity-0 shadow-xl transition-opacity group-hover:opacity-100 group-focus-within:opacity-100"
                                >
                                    {ON_CHAIN_SCORE_TOOLTIP}
                                </span>
                            </span>
                        </span>
                        {externalScore != null
                            ? <ScoreOutOf100 value={externalScore} size="sm" />
                            : <span className="text-sm text-subtle font-semibold leading-none">—</span>
                        }
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
