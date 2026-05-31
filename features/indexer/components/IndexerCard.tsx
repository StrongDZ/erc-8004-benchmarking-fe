"use client";
import { useState, useEffect } from "react";
import { Copy, Check, Cpu, Users, MessageSquare, Activity } from "lucide-react";
import { Card, CardContent } from "@/shared/ui/Card";
import { ChainBadge } from "@/shared/ui/ChainBadge";
import type { IndexerChainStatusView } from "@/shared/api/client";
import { truncateAddress } from "@/shared/api/client";

function CopyField({ label, value }: { label: string; value?: string }) {
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        if (!copied) return;
        const timer = setTimeout(() => setCopied(false), 1500);
        return () => clearTimeout(timer);
    }, [copied]);

    if (!value) return null;

    function copy() {
        navigator.clipboard.writeText(value!);
        setCopied(true);
    }

    return (
        <div className="flex flex-col gap-0.5">
            <span className="text-[10px] uppercase tracking-widest text-subtle font-semibold">{label}</span>
            <button
                onClick={copy}
                title={value}
                className="flex items-center gap-1.5 text-[12px] font-mono text-muted hover:text-white transition-colors group w-fit"
            >
                <span>{value}</span>
                {copied ? (
                    <Check size={11} className="text-success shrink-0" />
                ) : (
                    <Copy size={11} className="opacity-0 group-hover:opacity-60 shrink-0 transition-opacity" />
                )}
            </button>
        </div>
    );
}

interface Props {
    status: IndexerChainStatusView;
    liveBlock?: number;
}

export default function IndexerCard({ status, liveBlock }: Props) {
    const block = liveBlock ?? status.lastProcessedBlock;
    const isLive = liveBlock !== undefined && liveBlock !== status.lastProcessedBlock;

    const chainMeta = {
        chainId: status.chainId,
        name: status.chainName ?? `Chain ${status.chainId}`,
        shortName: status.chainName ?? String(status.chainId),
        iconUrl: status.iconUrl,
        brandColor: status.brandColor,
    };

    return (
        <Card className="flex flex-col gap-4 p-5 hover:border-border/80 transition-colors">
            {/* Header */}
            <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                    <ChainBadge chainId={status.chainId} chain={chainMeta} size="md" />
                    <span className="text-xs font-mono text-subtle">#{status.chainId}</span>
                </div>
            </div>

            {/* Block counter */}
            <div className="flex items-center gap-2.5">
                <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-primary/10 border border-primary/20 shrink-0">
                    <Cpu size={16} className="text-primary" />
                </div>
                <div>
                    <div className="flex items-center gap-1.5">
                        <span className="text-xl font-bold font-heading text-white tabular-nums">{block.toLocaleString()}</span>
                        {isLive && (
                            <span className="text-[10px] font-semibold text-success bg-success/10 border border-success/20 rounded px-1.5 py-0.5 animate-pulse">
                                LIVE
                            </span>
                        )}
                    </div>
                    <span className="text-[10px] uppercase tracking-widest text-subtle">Last Processed Block</span>
                </div>
            </div>

            {/* Stats row */}
            <div className="grid grid-cols-2 gap-3">
                <div className="flex items-center gap-2.5 bg-white/[0.03] rounded-lg px-3 py-2.5 border border-border/50">
                    <Users size={14} className="text-accent shrink-0" />
                    <div>
                        <div className="text-base font-bold text-white tabular-nums">{(status.agentCount ?? 0).toLocaleString()}</div>
                        <div className="text-[10px] uppercase tracking-widest text-subtle">Agents</div>
                    </div>
                </div>
                <div className="flex items-center gap-2.5 bg-white/[0.03] rounded-lg px-3 py-2.5 border border-border/50">
                    <MessageSquare size={14} className="text-success shrink-0" />
                    <div>
                        <div className="text-base font-bold text-white tabular-nums">{(status.feedbackCount ?? 0).toLocaleString()}</div>
                        <div className="text-[10px] uppercase tracking-widest text-subtle">Feedbacks</div>
                    </div>
                </div>
            </div>

            {/* Registry addresses */}
            {(status.identityRegistry || status.reputationRegistry) && (
                <div className="flex flex-col gap-2 pt-2 border-t border-border/50">
                    <CopyField label="Identity Registry" value={status.identityRegistry} />
                    <CopyField label="Reputation Registry" value={status.reputationRegistry} />
                </div>
            )}

            {status.lastIndexedAt && (
                <div className="flex items-center gap-1.5 text-[10px] text-subtle">
                    <Activity size={10} />
                    <span>Last indexed: {new Date(status.lastIndexedAt).toLocaleString()}</span>
                </div>
            )}
        </Card>
    );
}
