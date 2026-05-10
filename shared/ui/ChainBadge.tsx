"use client";

import { useState } from "react";
import type { Chain } from "@/shared/api/client";

export type ChainBadgeChain = Pick<Chain, "chainId" | "name" | "shortName" | "iconUrl" | "brandColor">;

export interface ChainBadgeProps {
    chainId: number;
    chain?: ChainBadgeChain | null;
    className?: string;
    /** sm: table / dense; md: cards */
    size?: "sm" | "md";
}

function labelFor(chain: ChainBadgeChain | null | undefined, chainId: number): string {
    if (chain?.name) return chain.name;
    if (chain?.shortName) return chain.shortName;
    return `Chain ${chainId}`;
}

function ChainIcon({ iconUrl, chainId, size }: { iconUrl?: string; chainId: number; size: "sm" | "md" }) {
    const [failed, setFailed] = useState(false);
    const box = size === "md" ? "w-5 h-5" : "w-4 h-4";
    if (!iconUrl || failed) {
        return (
            <span
                className={`${box} rounded-full bg-white/15 shrink-0 flex items-center justify-center text-[8px] font-mono text-white/85 ring-1 ring-white/20`}
                aria-hidden
            >
                {String(chainId).length <= 4 ? chainId : String(chainId).slice(-3)}
            </span>
        );
    }
    return (
        <img
            src={iconUrl}
            alt=""
            width={size === "md" ? 20 : 16}
            height={size === "md" ? 20 : 16}
            className={`${box} rounded-full object-cover ring-1 ring-white/30 shrink-0`}
            onError={() => setFailed(true)}
        />
    );
}

/**
 * Pill badge: chain logo + chain name on a tinted brand background (from API iconUrl / brandColor).
 */
export function ChainBadge({ chainId, chain, className = "", size = "sm" }: ChainBadgeProps) {
    const text = labelFor(chain, chainId);
    const color = chain?.brandColor;

    const pad = size === "md" ? "py-1.5 pl-1.5 pr-3.5 gap-2.5 text-sm" : "py-1 pl-1 pr-2.5 gap-2 text-[12px] leading-tight";

    return (
        <span
            className={`inline-flex items-center max-w-full rounded-full font-semibold text-white border border-white/15 shadow-sm ${pad} ${className}`}
            style={
                color
                    ? {
                          backgroundColor: `${color}22`,
                          borderColor: `${color}55`,
                      }
                    : { backgroundColor: "rgba(255, 255, 255, 0.07)" }
            }
            title={chain?.name ?? text}
        >
            <ChainIcon iconUrl={chain?.iconUrl} chainId={chainId} size={size} />
            <span className="truncate">{text}</span>
        </span>
    );
}
