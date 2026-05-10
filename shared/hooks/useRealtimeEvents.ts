'use client';
// shared/hooks/useRealtimeEvents.ts
// Maintains a capped, newest-first list of decoded on-chain events streamed
// from the API WebSocket. Backed by useSocketEvent('event.decoded').

import { useCallback, useState } from 'react';
import { useSocketEvent } from './useSocketEvent';

export interface RealtimeEvent {
    type: 'event.decoded';
    eventName: string;
    contractType?: string;
    chainId: number;
    agentId?: string;
    txHash: string;
    blockNumber?: number;
    logIndex?: number;
    timestamp?: number;
    args?: Record<string, unknown>;
}

// Stable dedupe key for a decoded event; (chainId, txHash, logIndex) is unique
// at the chain level even when the same tx emits multiple events.
function keyOf(ev: RealtimeEvent): string {
    return `${ev.chainId}:${ev.txHash}:${ev.logIndex ?? 0}`;
}

export function useRealtimeEvents(maxItems = 4): {
    events: RealtimeEvent[];
    clear: () => void;
} {
    const [events, setEvents] = useState<RealtimeEvent[]>([]);

    useSocketEvent<RealtimeEvent>('event.decoded', (ev) => {
        setEvents((prev) => {
            if (prev.some((p) => keyOf(p) === keyOf(ev))) return prev;
            const next = [ev, ...prev];
            return next.length > maxItems ? next.slice(0, maxItems) : next;
        });
    });

    const clear = useCallback(() => setEvents([]), []);
    return { events, clear };
}
