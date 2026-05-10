'use client';
import { useState } from 'react';
import { Wallet, Copy, Check, ExternalLink } from 'lucide-react';
import { explorerAddressUrl, truncateAddress } from '@/shared/api/client';
import { Badge } from '@/shared/ui/Badge';

interface Props {
    address: string;
    chainId?: number;
    ownedCount: number;
    ownedLoading: boolean;
    feedbackCount: number;
    interactedCount: number;
}

export default function WalletHero({ address, chainId = 1, ownedCount, ownedLoading, feedbackCount, interactedCount }: Props) {
    const [copied, setCopied] = useState(false);

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(address);
            setCopied(true);
            setTimeout(() => setCopied(false), 1200);
        } catch {
            setCopied(false);
        }
    };

    return (
        <div className="card p-6 md:p-8">
            <div className="flex flex-col md:flex-row gap-6 md:items-start">
                {/* Left: identity */}
                <div className="flex items-start gap-4 flex-1 min-w-0">
                    <div className="w-16 h-16 shrink-0 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center">
                        <Wallet size={28} className="text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <span className="text-xs uppercase tracking-wider text-subtle font-semibold block mb-1.5">
                            Wallet Address
                        </span>
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                            <span
                                className="font-mono text-lg font-bold text-white"
                                title={address}
                            >
                                {truncateAddress(address, 12)}
                            </span>
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
                                rel="noreferrer"
                                className="shrink-0 text-subtle hover:text-primary transition-colors"
                                title="View on block explorer"
                            >
                                <ExternalLink size={14} />
                            </a>
                        </div>
                        <p className="text-[11px] text-subtle font-mono break-all">{address}</p>
                    </div>
                </div>

                {/* Right: reputation score placeholder */}
                <div className="card-glass p-4 flex flex-col items-start min-w-[180px] shrink-0">
                    <div className="flex items-center gap-2 mb-2">
                        <span className="text-xs uppercase tracking-wider text-subtle">Reputation</span>
                        <Badge variant="muted" style={{ fontSize: '0.6rem', padding: '1px 5px' }}>
                            Coming soon
                        </Badge>
                    </div>
                    <span className="text-4xl font-heading font-bold text-subtle leading-none">—</span>
                    <span className="text-xs text-subtle mt-1">/ 1000</span>
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
