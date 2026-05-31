'use client';
// features/leaderboard/components/RealtimeEventFeed.tsx
// Live ticker of decoded on-chain events streamed from /api/v1/ws. Keeps only the
// newest few rows (default 4); older entries are dropped. Each row links to the
// tx explorer and the agent profile.

import Link from 'next/link';
import { useMemo } from 'react';
import { Activity, Radio } from 'lucide-react';
import { useSocket } from '@/providers/SocketProvider';
import { useChain } from '@/providers/ChainProvider';
import { useRealtimeEvents, RealtimeEvent } from '@/shared/hooks/useRealtimeEvents';
import { Chain, explorerUrl, truncateAddress } from '@/shared/api/client';
import { ChainBadge } from '@/shared/ui/ChainBadge';
import { LinkOutbound } from '@/shared/ui/LinkOutbound';

interface Props {
    max?: number;
}

const COL_COUNT = 7;

const iconByContract: Record<string, { dot: string; label: string }> = {
    identity: { dot: 'bg-primary', label: 'Identity' },
    reputation: { dot: 'bg-accent', label: 'Reputation' },
    validation: { dot: 'bg-success', label: 'Validation' },
};

function formatEventTime(ts: number | undefined): string {
    if (ts === undefined || Number.isNaN(ts)) return '—';
    const ms = ts < 1e12 ? ts * 1000 : ts;
    return new Date(ms).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function EventTableRow({ ev, chain }: { ev: RealtimeEvent; chain?: Chain | null }) {
    const meta = iconByContract[ev.contractType ?? ''] ?? { dot: 'bg-muted', label: ev.contractType ?? 'event' };
    return (
        <tr className="hover:bg-white/5 transition-colors">
            <td className="max-w-0 px-2 py-2.5 align-middle">
                <div className="flex items-center gap-2 min-w-0">
                    <span className={`w-2 h-2 rounded-full shrink-0 ${meta.dot}`} aria-hidden />
                    <span className="truncate text-xs font-medium text-muted">{meta.label}</span>
                </div>
            </td>
            <td className="max-w-0 px-2 py-2.5 align-middle">
                <span className="block truncate font-semibold text-white text-sm" title={ev.eventName}>
                    {ev.eventName}
                </span>
            </td>
            <td className="max-w-0 px-2 py-2.5 align-middle">
                <ChainBadge chainId={ev.chainId} chain={chain} size="sm" className="max-w-full" />
            </td>
            <td className="max-w-0 px-2 py-2.5 align-middle">
                {ev.agentId ? (
                    <Link
                        href={`/agents/${ev.chainId}/${ev.agentId}`}
                        className="block truncate text-xs text-primary hover:underline"
                        title={ev.agentId}
                    >
                        #{ev.agentId}
                    </Link>
                ) : (
                    <span className="text-subtle">—</span>
                )}
            </td>
            <td className="max-w-0 px-2 py-2.5 align-middle">
                <LinkOutbound
                    href={explorerUrl(ev.chainId, ev.txHash)}
                    external
                    className="inline-flex w-full min-w-0 truncate font-mono text-xs text-muted hover:text-white"
                    title={ev.txHash}
                >
                    {truncateAddress(ev.txHash, 6)}
                </LinkOutbound>
            </td>
            <td className="max-w-0 px-2 py-2.5 align-middle text-right tabular-nums text-xs text-muted">
                {ev.blockNumber != null ? ev.blockNumber.toLocaleString() : '—'}
            </td>
            <td className="max-w-0 px-2 py-2.5 align-middle whitespace-nowrap text-xs text-subtle">
                {formatEventTime(ev.timestamp)}
            </td>
        </tr>
    );
}

export default function RealtimeEventFeed({ max = 4 }: Props) {
    const { state } = useSocket();
    const { chains } = useChain();
    const chainMap = useMemo(() => new Map(chains.map((c) => [c.chainId, c])), [chains]);
    const { events } = useRealtimeEvents(max);

    const stateLabel =
        state === 'open' ? 'Live' :
        state === 'connecting' ? 'Connecting…' :
        state === 'reconnecting' ? 'Reconnecting…' : 'Offline';
    const stateColor =
        state === 'open' ? 'text-success' :
        state === 'connecting' || state === 'reconnecting' ? 'text-accent' : 'text-muted';

    return (
        <div className="bg-card border border-border rounded-xl p-5 h-full flex flex-col min-h-[340px]">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-white/5">
                <div className="flex items-center gap-2">
                    <Radio size={16} className="text-primary" />
                    <h2 className="text-base font-bold text-white">Realtime Events</h2>
                </div>
                <div className={`flex items-center gap-1.5 text-xs font-medium ${stateColor}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${state === 'open' ? 'bg-success animate-pulse' : 'bg-muted'}`} />
                    {stateLabel}
                </div>
            </div>

            {events.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center text-muted text-sm gap-2 rounded-lg border border-border bg-black/20 min-h-[200px]">
                    <Activity size={24} className="text-muted/60" />
                    <span>Waiting for on-chain events…</span>
                </div>
            ) : (
                <div className="flex-1 overflow-y-auto overflow-x-auto pr-1 -mr-1 rounded-lg border border-border bg-black/20">
                    <table className="data-table table-fixed w-full min-w-[700px] text-sm">
                        <colgroup>
                            <col style={{ width: '12%' }} />
                            <col style={{ width: '15%' }} />
                            <col style={{ width: '17%' }} />
                            <col style={{ width: '10%' }} />
                            <col style={{ width: '18%' }} />
                            <col style={{ width: '10%' }} />
                            <col style={{ width: '15%' }} />
                        </colgroup>
                        <thead>
                            <tr>
                                <th className="px-2 py-2.5">Type</th>
                                <th className="px-2 py-2.5">Event</th>
                                <th className="px-2 py-2.5">Chain</th>
                                <th className="px-2 py-2.5">Agent</th>
                                <th className="px-2 py-2.5">Tx</th>
                                <th className="px-2 py-2.5 text-right">Block</th>
                                <th className="px-2 py-2.5">Time</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {events.map((ev) => (
                                <EventTableRow
                                    key={`${ev.chainId}:${ev.txHash}:${ev.logIndex ?? 0}`}
                                    ev={ev}
                                    chain={chainMap.get(ev.chainId)}
                                />
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
