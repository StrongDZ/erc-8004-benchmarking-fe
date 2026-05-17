"use client";
// features/leaderboard/components/AgentsTable.tsx
// Dashboard agents table: Name | Chain | Service | Score | Feedback | Owner | Created.

import type { ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AgentService, Chain, LeaderboardAgent, resolveIPFS, truncateAddress } from "@/shared/api/client";
import { FALLBACK_AVATAR_DATA_URI } from "@/shared/constants/app";
import { Badge } from "@/shared/ui/Badge";
import { ChainBadge } from "@/shared/ui/ChainBadge";

interface Props {
    agents: LeaderboardAgent[];
    chains?: Chain[];
    loading?: boolean;
    /** Rows per page; empty placeholder rows pad the tbody so layout height stays stable. */
    pageSize?: number;
}

function fallbackImg(e: React.SyntheticEvent<HTMLImageElement>) {
    (e.target as HTMLImageElement).src = FALLBACK_AVATAR_DATA_URI;
}

function formatCreated(ts?: number): string {
    if (!ts) return "—";
    const diff = Date.now() - ts * 1000;
    const sec = Math.floor(diff / 1000);
    if (sec < 60) return "just now";
    const min = Math.floor(sec / 60);
    if (min < 60) return `${min}m ago`;
    const hr = Math.floor(min / 60);
    if (hr < 24) return `${hr}h ago`;
    const d = Math.floor(hr / 24);
    if (d < 30) return `${d}d ago`;
    return new Date(ts * 1000).toLocaleDateString();
}

function serviceCell(services?: AgentService[]) {
    if (!services?.length) return <span className="text-muted text-xs">—</span>;
    const full = services.map((s) => s.name).join(", ");
    return (
        <div className="flex min-w-0 flex-nowrap items-center gap-1 overflow-hidden" title={full}>
            {services.slice(0, 3).map((s) => (
                <Badge key={s.name} variant="primary" size="xxs" className="max-w-[5.5rem] truncate shrink-0">
                    {s.name}
                </Badge>
            ))}
            {services.length > 3 && <span className="shrink-0 text-[10px] font-medium text-muted">+{services.length - 3}</span>}
        </div>
    );
}

const DEFAULT_PAGE_SIZE = 10;

function AgentsTableThead() {
    return (
        <thead className="bg-black/40 text-muted uppercase text-xs sticky top-0 font-semibold tracking-wider">
            <tr>
                <th className="w-[24%] px-4 py-2.5 font-medium border-b border-white/5">Name</th>
                <th className="w-[11%] px-4 py-2.5 font-medium border-b border-white/5">Chain</th>
                <th className="w-[22%] px-4 py-2.5 font-medium border-b border-white/5">Service</th>
                <th className="w-[7%] px-4 py-2.5 font-medium border-b border-white/5 text-right">Score</th>
                <th className="w-[9%] px-4 py-2.5 font-medium border-b border-white/5 text-right">Feedback</th>
                <th className="w-[15%] px-4 py-2.5 font-medium border-b border-white/5">Owner</th>
                <th className="w-[12%] px-4 py-2.5 font-medium border-b border-white/5 text-right">Created</th>
            </tr>
        </thead>
    );
}

function AgentsTableShell({ children }: { children: ReactNode }) {
    return (
        <div className="w-full overflow-x-auto rounded-lg border border-border bg-black/20">
            <table className="data-table w-full table-fixed text-left text-sm">
                <AgentsTableThead />
                {children}
            </table>
        </div>
    );
}

function LoadingRows({ pageSize }: { pageSize: number }) {
    return (
        <tbody className="divide-y divide-white/5" aria-busy="true" aria-label="Loading agents">
            {Array.from({ length: pageSize }).map((_, i) => (
                <tr key={i} className="pointer-events-none">
                    <td className="max-w-0 px-4 py-2.5 align-middle">
                        <div className="flex min-w-0 items-center gap-2">
                            <div className="skeleton h-9 w-9 shrink-0 rounded-full" style={{ animationDelay: `${i * 0.04}s` }} />
                            <div className="min-w-0 flex-1 space-y-1.5 py-0.5">
                                <div className="skeleton h-3.5 w-full max-w-[12rem] rounded" style={{ animationDelay: `${i * 0.04}s` }} />
                                <div className="skeleton h-3 w-16 rounded" style={{ animationDelay: `${i * 0.04}s` }} />
                            </div>
                        </div>
                    </td>
                    <td className="max-w-0 px-4 py-2.5 align-middle">
                        <div className="skeleton mx-0 h-6 w-[4.5rem] rounded-full" style={{ animationDelay: `${i * 0.04}s` }} />
                    </td>
                    <td className="max-w-0 px-4 py-2.5 align-middle">
                        <div className="skeleton h-4 w-full max-w-[6rem] rounded" style={{ animationDelay: `${i * 0.04}s` }} />
                    </td>
                    <td className="max-w-0 px-4 py-2.5 text-right align-middle">
                        <div className="skeleton ml-auto h-4 w-10 rounded" style={{ animationDelay: `${i * 0.04}s` }} />
                    </td>
                    <td className="max-w-0 px-4 py-2.5 text-right align-middle">
                        <div className="skeleton ml-auto h-4 w-12 rounded" style={{ animationDelay: `${i * 0.04}s` }} />
                    </td>
                    <td className="max-w-0 px-4 py-2.5 align-middle">
                        <div className="skeleton h-3.5 w-24 rounded" style={{ animationDelay: `${i * 0.04}s` }} />
                    </td>
                    <td className="max-w-0 px-4 py-2.5 text-right align-middle">
                        <div className="skeleton ml-auto h-3.5 w-14 rounded" style={{ animationDelay: `${i * 0.04}s` }} />
                    </td>
                </tr>
            ))}
        </tbody>
    );
}

export default function AgentsTable({ agents, chains = [], loading, pageSize = DEFAULT_PAGE_SIZE }: Props) {
    const router = useRouter();
    const chainMap = new Map(chains.map((c) => [c.chainId, c]));

    if (loading) {
        return (
            <AgentsTableShell>
                <LoadingRows pageSize={pageSize} />
            </AgentsTableShell>
        );
    }

    if (!agents.length) {
        return (
            <AgentsTableShell>
                <tbody>
                    <tr>
                        <td colSpan={7} className="py-16 text-center text-muted">
                            <p className="font-medium">No agents match your filters.</p>
                            <p className="text-xs mt-1 text-subtle">Try clearing some filters to expand the result set.</p>
                        </td>
                    </tr>
                    {Array.from({ length: Math.max(0, pageSize - 1) }).map((_, i) => (
                        <tr key={`_pad_empty_${i}`} aria-hidden className="pointer-events-none select-none">
                            <td colSpan={7} className="border-b border-white/5 bg-transparent px-4 py-2.5">
                                <div className="h-9" />
                            </td>
                        </tr>
                    ))}
                </tbody>
            </AgentsTableShell>
        );
    }

    const padRows = Math.max(0, pageSize - agents.length);

    return (
        <AgentsTableShell>
            <tbody className="divide-y divide-white/5">
                {agents.map((a) => {
                    const chain = chainMap.get(a.chainId);
                    return (
                        <tr
                            key={`${a.chainId}:${a.agentId}`}
                            onClick={() => router.push(`/agents/${a.chainId}/${a.agentId}`)}
                            className="hover:bg-white/5 cursor-pointer transition-colors group"
                        >
                            <td className="max-w-0 px-4 py-2.5 align-middle">
                                <div className="flex min-w-0 items-center gap-2">
                                    <img
                                        src={resolveIPFS(a.image)}
                                        alt={a.name ? `${a.name} avatar` : `Agent ${a.agentId} avatar`}
                                        className="h-9 w-9 shrink-0 rounded-full border border-border group-hover:border-primary transition-colors"
                                        onError={fallbackImg}
                                    />
                                    <div className="min-w-0 flex-1">
                                        <div className="flex min-w-0 items-center gap-1 leading-none">
                                            <span
                                                className="min-w-0 truncate text-sm font-semibold leading-tight text-white group-hover:text-primary transition-colors"
                                                title={a.name || `Agent #${a.agentId}`}
                                            >
                                                {a.name || `Agent #${a.agentId}`}
                                            </span>
                                            <span className="flex shrink-0 items-center gap-0.5">
                                                {a.hasOASF && (
                                                    <Badge variant="success" size="xxs">OASF</Badge>
                                                )}
                                                {a.x402Support && (
                                                    <Badge variant="primary" size="xxs">x402</Badge>
                                                )}
                                            </span>
                                        </div>
                                        <span className="mt-0.5 block truncate text-[12px] leading-tight text-muted" title={`#${a.agentId}`}>
                                            #{a.agentId}
                                        </span>
                                    </div>
                                </div>
                            </td>
                            <td className="max-w-0 px-4 py-2.5 align-middle overflow-hidden">
                                <div className="min-w-0">
                                    <ChainBadge chainId={a.chainId} chain={chain} size="sm" className="max-w-full" />
                                </div>
                            </td>
                            <td className="max-w-0 px-4 py-2.5 align-middle">{serviceCell(a.services)}</td>
                            <td className="max-w-0 px-4 py-2.5 text-right align-middle whitespace-nowrap tabular-nums">
                                <span className="font-bold text-primary">
                                    {a.trustScore.toFixed(1)}<span className="text-[10px] font-normal text-muted ml-0.5">/100</span>
                                </span>
                            </td>
                            <td className="max-w-0 px-4 py-2.5 text-right align-middle whitespace-nowrap tabular-nums text-white">
                                {a.totalTasks.toLocaleString()}
                            </td>
                            <td className="max-w-0 min-w-0 px-4 py-2.5 align-middle">
                                {a.owner ? (
                                    <Link
                                        href={`/wallet/${a.owner}`}
                                        onClick={(e) => e.stopPropagation()}
                                        className="inline-flex w-full min-w-0 truncate font-mono text-xs text-muted hover:text-primary transition-colors"
                                        title={a.owner}
                                    >
                                        {truncateAddress(a.owner)}
                                    </Link>
                                ) : (
                                    <span className="text-muted text-xs">—</span>
                                )}
                            </td>
                            <td className="max-w-0 px-4 py-2.5 text-right align-middle">
                                <span className="block truncate text-xs text-subtle whitespace-nowrap" title={formatCreated(a.createdAt)}>
                                    {formatCreated(a.createdAt)}
                                </span>
                            </td>
                        </tr>
                    );
                })}
                {Array.from({ length: padRows }).map((_, i) => (
                    <tr key={`_pad_${i}`} aria-hidden className="pointer-events-none select-none">
                        {/* Match data row height: same vertical padding as other cells + h-9 (avatar) content band */}
                        <td colSpan={7} className="border-b border-white/5 bg-transparent px-4 py-2.5">
                            <div className="h-9" />
                        </td>
                    </tr>
                ))}
            </tbody>
        </AgentsTableShell>
    );
}
