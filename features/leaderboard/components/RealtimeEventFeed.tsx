'use client';
// features/leaderboard/components/RealtimeEventFeed.tsx
// Live ticker of decoded on-chain events streamed from /api/v1/ws. Drops oldest
// entries past the cap; each row links to the tx explorer and the agent profile.

import Link from 'next/link';
import { Activity, ExternalLink, Radio } from 'lucide-react';
import { useSocket } from '@/providers/SocketProvider';
import { useRealtimeEvents, RealtimeEvent } from '@/shared/hooks/useRealtimeEvents';
import { explorerUrl, truncateAddress } from '@/shared/api/client';

interface Props {
    max?: number;
}

// Map of contractType -> human-facing icon/color. Defaults to Activity.
const iconByContract: Record<string, { dot: string; label: string }> = {
    identity: { dot: 'bg-primary', label: 'Identity' },
    reputation: { dot: 'bg-accent', label: 'Reputation' },
    validation: { dot: 'bg-success', label: 'Validation' },
};

function EventRow({ ev }: { ev: RealtimeEvent }) {
    const meta = iconByContract[ev.contractType ?? ''] ?? { dot: 'bg-muted', label: ev.contractType ?? 'event' };
    return (
        <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-white/5 border border-transparent hover:border-border transition-colors group">
            <span className={`w-2 h-2 rounded-full ${meta.dot} shadow-[0_0_8px_currentColor] flex-shrink-0`} />
            <div className="flex flex-col flex-1 min-w-0">
                <div className="flex items-center gap-2 text-sm">
                    <span className="font-semibold text-white truncate">{ev.eventName}</span>
                    <span className="text-xs text-muted bg-black/40 px-1.5 py-0.5 rounded">{meta.label}</span>
                </div>
                <div className="flex items-center gap-3 text-xs text-muted mt-0.5">
                    <span className="tabular-nums">chain {ev.chainId}</span>
                    {ev.agentId && (
                        <Link href={`/agents/${ev.chainId}/${ev.agentId}`} className="text-primary hover:underline">
                            agent {ev.agentId}
                        </Link>
                    )}
                    <a
                        href={explorerUrl(ev.chainId, ev.txHash)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 hover:text-white transition-colors"
                    >
                        {truncateAddress(ev.txHash, 6)} <ExternalLink size={10} />
                    </a>
                </div>
            </div>
        </div>
    );
}

export default function RealtimeEventFeed({ max = 25 }: Props) {
    const { state } = useSocket();
    const { events } = useRealtimeEvents(max);

    const stateLabel =
        state === 'open' ? 'Live' :
        state === 'connecting' ? 'Connecting…' :
        state === 'reconnecting' ? 'Reconnecting…' : 'Offline';
    const stateColor =
        state === 'open' ? 'text-success' :
        state === 'connecting' || state === 'reconnecting' ? 'text-accent' : 'text-muted';

    return (
        <div className="bg-background/50 border border-border rounded-xl p-5 shadow-xl backdrop-blur-sm h-full flex flex-col min-h-[340px]">
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

            <div className="flex-1 overflow-y-auto flex flex-col gap-1 pr-1 -mr-1">
                {events.length === 0 ? (
                    <div className="flex flex-1 flex-col items-center justify-center text-center text-muted text-sm py-8 gap-2">
                        <Activity size={24} className="text-muted/60" />
                        <span>Waiting for on-chain events…</span>
                    </div>
                ) : (
                    events.map((ev) => (
                        <EventRow key={`${ev.chainId}:${ev.txHash}:${ev.logIndex ?? 0}`} ev={ev} />
                    ))
                )}
            </div>
        </div>
    );
}
