'use client';
// shared/hooks/useSocketEvent.ts
// Subscribe to a specific WebSocket payload type and invoke a handler for matching
// frames. Handler ref is kept fresh without re-subscribing on every render.

import { useEffect, useRef } from 'react';
import { useSocket } from '@/providers/SocketProvider';

export function useSocketEvent<TPayload = any>(
    type: string,
    handler: (payload: TPayload) => void,
) {
    const { client } = useSocket();
    const handlerRef = useRef(handler);
    handlerRef.current = handler;

    useEffect(() => {
        if (!client) return;
        const unsub = client.subscribe((payload: any) => {
            if (payload && payload.type === type) handlerRef.current(payload as TPayload);
        });
        return unsub;
    }, [client, type]);
}
